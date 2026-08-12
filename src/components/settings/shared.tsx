"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const G = {
  grad: "linear-gradient(135deg, var(--theme-accent, #F59E0B), var(--theme-accent-light, #EAB308))",
  gradText: {
    color: "var(--theme-text-main, #0F172A)",
  },
  card: {
    background: "var(--theme-card-bg, var(--card-bg, transparent))",
    border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.2))",
    borderRadius: "16px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  },
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--theme-hover-bg, var(--theme-card-bg, transparent))",
  border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.25))",
  borderRadius: "10px",
  padding: "11px 14px",
  color: "var(--theme-text-main, inherit)",
  fontSize: "0.9rem",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "all 0.18s ease-out",
  accentColor: "var(--theme-accent, #F59E0B)",
};

export function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    background: "var(--theme-accent, #F59E0B)",
    border: "none",
    color: "var(--theme-accent-text, #FFFFFF)",
    padding: "11px 22px",
    borderRadius: "10px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: "0.88rem",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.18s ease-out",
    boxShadow: disabled ? "none" : "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.25))",
  };
}

export function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  const isSuccess = type === "success";
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "10px",
        marginBottom: "18px",
        fontSize: "0.85rem",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: isSuccess ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
        border: `1px solid ${isSuccess ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
        color: isSuccess ? "#22C55E" : "#EF4444",
        boxSizing: "border-box",
      }}
    >
      {isSuccess ? <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> : <AlertCircle size={18} style={{ flexShrink: 0 }} />}
      <span>{message}</span>
    </div>
  );
}

export function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--theme-text-main, inherit)" }}>
        {title}
      </label>
      {hint && (
        <p style={{ fontSize: "0.78rem", color: "var(--theme-text-sub, #64748B)", marginTop: "2px", margin: "2px 0 0 0" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: 800,
          color: "var(--theme-text-main, inherit)",
          margin: 0,
          marginBottom: hint ? "4px" : 0,
        }}
      >
        {title}
      </h2>
      {hint && <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.82rem", margin: 0 }}>{hint}</p>}
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
        borderBottom: "1px solid var(--theme-border, rgba(150, 150, 150, 0.15))",
        gap: "16px",
      }}
    >
      <div>
        <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--theme-text-main, inherit)", margin: 0 }}>{label}</p>
        {hint && (
          <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.76rem", marginTop: "2px", margin: "2px 0 0 0" }}>
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: "42px",
          height: "24px",
          borderRadius: "999px",
          border: "none",
          background: checked ? "var(--theme-accent, #F59E0B)" : "var(--theme-border, rgba(150, 150, 150, 0.3))",
          position: "relative",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.2s ease-out",
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
            background: "#FFFFFF",
            transition: "left 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
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
            type="button"
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: active ? "1px solid var(--theme-accent, #F59E0B)" : "1px solid var(--theme-border, rgba(150, 150, 150, 0.25))",
              background: active ? "var(--theme-accent-soft, rgba(245, 158, 11, 0.15))" : "var(--theme-card-bg, transparent)",
              color: active ? "var(--theme-accent, #F59E0B)" : "var(--theme-text-sub, inherit)",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.18s ease-out",
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
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: active ? "1px solid var(--theme-accent, #F59E0B)" : "1px solid var(--theme-border, rgba(150, 150, 150, 0.25))",
              background: active ? "var(--theme-accent-soft, rgba(245, 158, 11, 0.15))" : "var(--theme-card-bg, transparent)",
              color: active ? "var(--theme-accent, #F59E0B)" : "var(--theme-text-sub, inherit)",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.18s ease-out",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}