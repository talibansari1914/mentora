"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import notificationService, { AppNotification } from "@/services/notificationService";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const all = await notificationService.getNotifications();
      const dismissed = new Set(notificationService.getDismissedIds());
      setNotifications(all.filter((n) => !dismissed.has(n.id)));
    } catch {
      // Not fatal — the bell just shows nothing rather than breaking the header.
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Close the dropdown when clicking anywhere outside it — same pattern
  // as the avatar menu elsewhere in this header.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleDismiss(id: string) {
    notificationService.dismiss(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifications"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
          background: "var(--theme-card-bg, #111827)",
          color: "var(--theme-text-main, #F8FAFC)",
          cursor: "pointer",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          position: "relative",
          transition: "all 0.18s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--theme-accent-border, rgba(245, 158, 11, 0.3))";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--theme-border, rgba(255, 255, 255, 0.08))";
        }}
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#EF4444",
              border: "2px solid var(--theme-card-bg, #111827)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "56px",
            right: 0,
            width: "320px",
            maxWidth: "88vw",
            maxHeight: "420px",
            overflowY: "auto",
            background: "var(--theme-card-bg, #111827)",
            border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "14px",
            boxShadow: "0 12px 28px -8px rgba(0, 0, 0, 0.45)",
            zIndex: 200,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "var(--theme-text-main, #F8FAFC)",
            }}
          >
            Notifications
          </div>

          {loading ? (
            <p style={{ padding: "20px 16px", fontSize: "0.85rem", color: "var(--theme-text-sub, #94A3B8)" }}>
              Loading...
            </p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: "20px 16px", fontSize: "0.85rem", color: "var(--theme-text-sub, #94A3B8)" }}>
              You're all caught up — no notifications right now.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--theme-border, rgba(255, 255, 255, 0.06))",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--theme-text-main, #F8FAFC)", marginBottom: "4px" }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--theme-text-sub, #94A3B8)", lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(n.id)}
                  aria-label="Dismiss"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--theme-muted-text, #64748B)",
                    cursor: "pointer",
                    padding: "2px",
                    flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}