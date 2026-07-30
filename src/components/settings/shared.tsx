"use client";

export const G = {
  grad: "linear-gradient(135deg,#F59E0B,#FBBF24)",
  gradText: {
    background: "linear-gradient(135deg,#F59E0B,#FBBF24)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  card: {
    background: "#0B1220",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: "16px",
  },
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0F172A",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: "10px",
  padding: "11px 14px",
  color: "white",
  fontSize: ".9rem",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    background: G.grad,
    border: "none",
    color: "#111827",
    padding: "11px 22px",
    borderRadius: "10px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: ".88rem",
    opacity: disabled ? 0.6 : 1,
  };
}

export function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "10px",
        marginBottom: "18px",
        fontSize: ".85rem",
        background: type === "success" ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
        border: `1px solid ${type === "success" ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`,
        color: type === "success" ? "#22C55E" : "#EF4444",
      }}
    >
      {type === "success" ? "✓ " : "⚠ "}
      {message}
    </div>
  );
}

export function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "white" }}>{title}</label>
      {hint && <p style={{ fontSize: ".78rem", color: "#64748B", marginTop: "2px" }}>{hint}</p>}
    </div>
  );
}

export function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: hint ? "4px" : 0 }}>{title}</h2>
      {hint && <p style={{ color: "#64748B", fontSize: ".82rem" }}>{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        gap: "16px",
      }}
    >
      <div>
        <p style={{ fontSize: ".88rem", fontWeight: 600 }}>{label}</p>
        {hint && <p style={{ color: "#64748B", fontSize: ".76rem", marginTop: "2px" }}>{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: "42px",
          height: "24px",
          borderRadius: "999px",
          border: "none",
          background: checked ? G.grad : "rgba(255,255,255,.1)",
          position: "relative",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "21px" : "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: checked ? "#111827" : "white",
            transition: "left .15s",
          }}
        />
      </button>
    </div>
  );
}

export function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
              background: active ? G.grad : "transparent",
              color: active ? "#111827" : "#94A3B8",
              fontWeight: 700,
              fontSize: ".8rem",
              cursor: "pointer",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function MultiChipGroup({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  }

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
              background: active ? G.grad : "transparent",
              color: active ? "#111827" : "#94A3B8",
              fontWeight: 700,
              fontSize: ".8rem",
              cursor: "pointer",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}