"use client";

// ============================================================================
// src/components/auth/Turnstile.tsx
//
// Cloudflare Turnstile in "managed" appearance with interaction-only mode:
// it stays invisible for the vast majority of real users and only surfaces
// a small interactive challenge when the request looks suspicious. This is
// what Supabase Auth's built-in CAPTCHA protection expects — Supabase
// verifies the resulting token server-side on signUp/signInWithPassword,
// so no custom verification endpoint is needed here.
//
// Usage:
//   <Turnstile siteKey={...} onVerify={(token) => setCaptchaToken(token)} />
// The token is produced automatically once the widget mounts and is
// refreshed if it expires - onVerify fires again with the new token.
// ============================================================================

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          appearance?: "always" | "execute" | "interaction-only";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(script);
  });
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function Turnstile({ siteKey, onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Keep the latest callbacks in refs instead of the effect's dependency
  // array. The parent page re-renders on every keystroke (email/password
  // state), which would otherwise recreate these callbacks as new function
  // references each time, causing the effect below to tear down and
  // re-render the widget on every keystroke - the actual cause of the
  // repeated challenges.cloudflare.com errors and the widget becoming
  // visible instead of staying invisible. Refs let the widget mount once
  // per siteKey while still always calling the current callback.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          // "interaction-only": invisible unless Cloudflare's risk scoring
          // decides a real challenge is needed - this is the widget mode
          // the product decision settled on.
          appearance: "interaction-only",
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
        });
      })
      .catch((err) => {
        // If the script fails to load (ad blocker, offline, etc.), signup
        // and login should still be attempted - Supabase will simply reject
        // the request if CAPTCHA is required and no token was provided,
        // surfacing as a normal form error rather than a silent JS crash.
        console.error("[Turnstile] failed to initialize:", err);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // Deliberately excludes onVerify/onExpire - see refs above. The widget
    // should mount once per siteKey, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  // In "interaction-only" mode this div is 0x0 almost all the time and only
  // expands to show a small challenge widget when Cloudflare requires one.
  return <div ref={containerRef} />;
}