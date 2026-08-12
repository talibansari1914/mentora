// ============================================================================
// src/lib/aiProvider.ts
//
// Single entry point for every AI call in the app. Responsibilities:
//   1. Hold a registry of all available providers (adapters + credentials).
//   2. Resolve a priority-ordered provider chain per task, ordered by
//      output quality first, resilience second.
//   3. On failure (rate limit, quota, timeout, malformed response), fail
//      over silently to the next provider in the chain. The caller only
//      ever sees a final { text, provider } result or a single terminal
//      error if every provider in the chain has failed.
//   4. Track per-provider cooldowns in memory so a provider that just
//      rate-limited isn't retried again within the same cooldown window,
//      saving a wasted network round trip on the next request.
//
// Adding a provider:  add one entry to PROVIDER_CONFIG.
// Adding a task:      add one entry to TASK_PROVIDER_CHAINS.
// Nothing else in this file needs to change for either of those.
// ============================================================================

export type ProviderName =
  | "gemini"
  | "groq"
  | "openrouter"
  | "cerebras"
  | "mistral"
  | "huggingface";

export type Capability = "text" | "multimodal";

export interface AIFile {
  mimeType: string;
  data: string; // base64, no data-url prefix
}

export interface CallAIParams {
  task: string;
  systemPrompt: string;
  userText: string;
  file?: AIFile; // only providers with "multimodal" capability will receive this
  maxOutputTokens?: number;
  // When true, asks the provider to constrain output to valid JSON. Every
  // provider here honors this at the API level where supported, but callers
  // should still parse defensively (see extractJSON below) since free-tier
  // models don't guarantee strict compliance.
  jsonMode?: boolean;
}

export interface CallAIResult {
  text: string;
  provider: ProviderName;
}

interface ProviderConfig {
  envKey: string;
  capabilities: Capability[];
  timeoutMs: number;
  request: (params: CallAIParams, apiKey: string, signal: AbortSignal) => Promise<Response>;
  extractText: (data: unknown) => string;
  isRateLimitError: (status: number, data: unknown) => boolean;
}

// Shape of a parsed JSON body from any of the OpenAI-compatible providers
// below (Groq, OpenRouter, Cerebras, Mistral, HuggingFace). `data` arrives
// here as `unknown` (it's the result of `response.json()` on a 3rd-party
// API, so its real shape is never guaranteed) — this describes only the
// fields extractOpenAIStyleText/isOpenAIStyleRateLimit actually read.
interface OpenAIStyleResponseBody {
  choices?: { message?: { content?: string } }[];
  error?: { code?: number; type?: string };
}

// Shape of a parsed JSON body from Gemini's generateContent endpoint —
// same "unknown at the boundary" reasoning as above.
interface GeminiResponseBody {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

// One part of a Gemini request payload (see the `gemini.request` builder
// below) — either inline file data or a plain text part.
interface GeminiRequestPart {
  inline_data?: { mime_type: string; data: string };
  text?: string;
}

// ----------------------------------------------------------------------------
// Shared helper: builds an OpenAI-compatible chat payload. Every provider
// below except Gemini speaks this dialect, so we don't repeat it six times.
// ----------------------------------------------------------------------------

function openAIStyleBody(model: string, params: CallAIParams, supportsVision: boolean) {
  const userContent =
    supportsVision && params.file
      ? [
          { type: "text", text: params.userText },
          {
            type: "image_url",
            image_url: { url: `data:${params.file.mimeType};base64,${params.file.data}` },
          },
        ]
      : params.userText;

  return {
    model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: userContent },
    ],
    max_tokens: params.maxOutputTokens ?? 4096,
    ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
  };
}

function extractOpenAIStyleText(data: unknown): string {
  return (data as OpenAIStyleResponseBody).choices?.[0]?.message?.content ?? "";
}

function isOpenAIStyleRateLimit(status: number, data: unknown): boolean {
  const body = data as OpenAIStyleResponseBody;
  return (
    status === 429 ||
    body?.error?.code === 429 ||
    body?.error?.type === "rate_limit_exceeded" ||
    body?.error?.type === "insufficient_quota"
  );
}

// ----------------------------------------------------------------------------
// Provider registry
// ----------------------------------------------------------------------------

const PROVIDER_CONFIG: Record<ProviderName, ProviderConfig> = {
  // Best general + multimodal quality among the free tiers. First choice
  // for anything involving an image/PDF, and for tasks that need strong
  // reasoning.
  gemini: {
    envKey: "GEMINI_API_KEY",
    capabilities: ["text", "multimodal"],
    timeoutMs: 25000,
    request: async (params, apiKey, signal) => {
      const parts: GeminiRequestPart[] = [];
      if (params.file) {
        parts.push({
          inline_data: { mime_type: params.file.mimeType, data: params.file.data },
        });
      }
      parts.push({ text: params.userText });

      return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: params.systemPrompt }] },
            contents: [{ role: "user", parts }],
            generationConfig: {
              maxOutputTokens: params.maxOutputTokens ?? 4096,
              thinkingConfig: { thinkingBudget: 0 },
              ...(params.jsonMode ? { responseMimeType: "application/json" } : {}),
            },
          }),
          signal,
        }
      );
    },
    extractText: (data) =>
      (data as GeminiResponseBody).candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join("\n") ?? "",
    isRateLimitError: (status) => status === 429,
  },

  // Fastest inference of the group (LPU hardware). Good default for
  // latency-sensitive, text-only tasks.
  groq: {
    envKey: "GROQ_API_KEY",
    capabilities: ["text"],
    timeoutMs: 15000,
    request: async (params, apiKey, signal) =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(openAIStyleBody("llama-3.3-70b-versatile", params, false)),
        signal,
      }),
    extractText: extractOpenAIStyleText,
    isRateLimitError: isOpenAIStyleRateLimit,
  },

  // Aggregator with many free models behind one key. Also our second
  // multimodal option (vision-capable free model) so image/PDF tasks
  // aren't single-provider-dependent.
  openrouter: {
    envKey: "OPENROUTER_API_KEY",
    capabilities: ["text", "multimodal"],
    timeoutMs: 20000,
    request: async (params, apiKey, signal) => {
      const model = params.file
        ? "qwen/qwen2.5-vl-72b-instruct:free"
        : "meta-llama/llama-3.3-70b-instruct:free";
      return fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(openAIStyleBody(model, params, true)),
        signal,
      });
    },
    extractText: extractOpenAIStyleText,
    isRateLimitError: isOpenAIStyleRateLimit,
  },

  // Highest raw throughput of the group; useful as a high-volume fallback
  // once the primary choice for a task is exhausted.
  cerebras: {
    envKey: "CEREBRAS_API_KEY",
    capabilities: ["text"],
    timeoutMs: 15000,
    request: async (params, apiKey, signal) =>
      fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        // Verify the current model id in the Cerebras docs before shipping -
        // free-tier model availability on Cerebras changes more often than
        // the other providers here.
        body: JSON.stringify(openAIStyleBody("llama-3.3-70b", params, false)),
        signal,
      }),
    extractText: extractOpenAIStyleText,
    isRateLimitError: isOpenAIStyleRateLimit,
  },

  // Strong at code and structured/technical output - primary pick for
  // code-mentor.
  mistral: {
    envKey: "MISTRAL_API_KEY",
    capabilities: ["text"],
    timeoutMs: 20000,
    request: async (params, apiKey, signal) =>
      fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(openAIStyleBody("mistral-small-latest", params, false)),
        signal,
      }),
    extractText: extractOpenAIStyleText,
    isRateLimitError: isOpenAIStyleRateLimit,
  },

  // Last-resort fallback via Hugging Face's OpenAI-compatible router.
  // Included purely for redundancy depth - if five other providers are
  // simultaneously exhausted, this keeps the feature alive rather than
  // failing the request outright.
  huggingface: {
    envKey: "HUGGINGFACE_API_KEY",
    capabilities: ["text"],
    timeoutMs: 25000,
    request: async (params, apiKey, signal) =>
      fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          openAIStyleBody("meta-llama/Llama-3.3-70B-Instruct", params, false)
        ),
        signal,
      }),
    extractText: extractOpenAIStyleText,
    isRateLimitError: isOpenAIStyleRateLimit,
  },
};

// ----------------------------------------------------------------------------
// Task -> provider chain, ordered by expected output quality for that task
// first, with every remaining provider appended as a resilience tail so a
// task never has fewer than 4 fallbacks available.
// ----------------------------------------------------------------------------

const TASK_PROVIDER_CHAINS: Record<string, ProviderName[]> = {
  "ai-tutor": ["gemini", "openrouter", "groq", "cerebras", "mistral", "huggingface"],
  "generate-notes": ["gemini", "groq", "openrouter", "cerebras", "mistral", "huggingface"],
  "writing-assistant": ["groq", "gemini", "openrouter", "mistral", "cerebras", "huggingface"],
  "code-mentor": ["mistral", "groq", "openrouter", "cerebras", "gemini", "huggingface"],
  "generate-practice": ["gemini", "groq", "openrouter", "cerebras", "mistral", "huggingface"],
  "mock-test-analysis": ["gemini", "groq", "openrouter", "cerebras", "mistral", "huggingface"],
  "book-tools": ["groq", "gemini", "openrouter", "cerebras", "mistral", "huggingface"],
  "video-notes": ["gemini", "openrouter", "groq", "cerebras", "mistral", "huggingface"],
};

const DEFAULT_CHAIN: ProviderName[] = [
  "gemini",
  "groq",
  "openrouter",
  "cerebras",
  "mistral",
  "huggingface",
];

// ----------------------------------------------------------------------------
// In-memory cooldown tracker. Resets on cold start - acceptable, since the
// worst case is a single wasted call, not a broken feature.
// ----------------------------------------------------------------------------

const cooldownUntil = new Map<ProviderName, number>();
const COOLDOWN_MS = 60_000;

function isOnCooldown(provider: ProviderName): boolean {
  const until = cooldownUntil.get(provider);
  return typeof until === "number" && Date.now() < until;
}

function markCooldown(provider: ProviderName) {
  cooldownUntil.set(provider, Date.now() + COOLDOWN_MS);
}

// ----------------------------------------------------------------------------
// Defensive JSON parsing for jsonMode responses. Free-tier models don't
// always respect "no markdown fences" instructions, so this strips common
// wrapping (```json fences) and slices to the outermost [...] or {...}
// before parsing. Shared here so every route that uses jsonMode parses the
// same way instead of re-implementing this.
// ----------------------------------------------------------------------------

export function extractJSON<T = unknown>(rawText: string): T {
  let cleaned = rawText
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  const firstBracket = cleaned.search(/[[{]/);
  const lastBracket = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }

  return JSON.parse(cleaned) as T;
}

// ----------------------------------------------------------------------------
// Main entry point
// ----------------------------------------------------------------------------

export async function callAI(params: CallAIParams): Promise<CallAIResult> {
  const chain = TASK_PROVIDER_CHAINS[params.task] ?? DEFAULT_CHAIN;

  const eligibleChain = params.file
    ? chain.filter((p) => PROVIDER_CONFIG[p].capabilities.includes("multimodal"))
    : chain;

  if (eligibleChain.length === 0) {
    throw new Error(`Task "${params.task}" has no provider that supports file/multimodal input.`);
  }

  let lastError: unknown = null;

  for (const providerName of eligibleChain) {
    const config = PROVIDER_CONFIG[providerName];
    const apiKey = process.env[config.envKey];

    if (!apiKey) continue; // key not configured - skip silently, this is a setup gap, not a user-facing error
    if (isOnCooldown(providerName)) continue;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await config.request(params, apiKey, controller.signal);
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      const rateLimited = config.isRateLimitError(response.status, data);

      if (!response.ok || rateLimited) {
        if (rateLimited) markCooldown(providerName);
        console.error(
          `[aiProvider] ${providerName} failed for task "${params.task}" (status ${response.status}); trying next provider.`
        );
        lastError = new Error(`${providerName} failed: ${response.status}`);
        continue;
      }

      const text = config.extractText(data);
      if (!text) {
        console.error(`[aiProvider] ${providerName} returned empty output for task "${params.task}".`);
        lastError = new Error(`${providerName} returned empty output`);
        continue;
      }

      return { text, provider: providerName };
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`[aiProvider] ${providerName} threw for task "${params.task}":`, err);
      lastError = err;
      continue;
    }
  }

  // Every provider in the chain failed. This is the single place a
  // user-facing failure originates from - the word "rate limit" must never
  // surface past this point.
  console.error(`[aiProvider] All providers exhausted for task "${params.task}".`, lastError);
  throw new Error("AI_ALL_PROVIDERS_FAILED");
}