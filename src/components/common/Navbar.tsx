"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      padding: scrolled ? "12px 0" : "20px 0",
      background: scrolled ? "rgba(8,12,20,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      transition: "all 0.3s ease",
    }}>
      <div className="navbar-container" style={{maxWidth: "1200px", margin: "0 auto", padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>

        {/* Logo */}
        <Link href="/" style={{display: "flex", alignItems: "center", gap: "10px", textDecoration: "none"}}>
          <div style={{width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #F59E0B, #F97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold", boxShadow: "0 3px 14px rgba(245,158,11,0.4)"}}>
            ⚡
          </div>
          <span style={{fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.02em", color: "white"}}>
            Mentor<span style={{color: "#F59E0B"}}>a</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <ul style={{display: "flex", alignItems: "center", gap: "36px", listStyle: "none", margin: 0, padding: 0}} className="hide-mobile">
          {["Features", "Exams", "Pricing"].map((item) => (
            <li key={item}>
              <Link href={`#${item.toLowerCase()}`} style={{fontSize: "0.9rem", fontWeight: 500, color: "#94A3B8", textDecoration: "none", transition: "color 0.2s"}}
                onMouseEnter={e => (e.target as HTMLElement).style.color = "white"}
                onMouseLeave={e => (e.target as HTMLElement).style.color = "#94A3B8"}>
                {item}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div style={{display: "flex", alignItems: "center", gap: "12px"}} className="hide-mobile">
          <Link href="/login" style={{fontSize: "0.875rem", fontWeight: 600, color: "#94A3B8", textDecoration: "none", padding: "9px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s"}}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = "white"; (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = "#94A3B8"; (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
            Log in
          </Link>
          <Link href="/signup" style={{fontSize: "0.875rem", fontWeight: 700, color: "#080C14", padding: "9px 20px", borderRadius: "10px", background: "linear-gradient(120deg, #F59E0B, #F97316)", boxShadow: "0 4px 16px rgba(245,158,11,0.35)", textDecoration: "none", transition: "all 0.2s"}}
            onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-2px)"; (e.target as HTMLElement).style.boxShadow = "0 8px 24px rgba(245,158,11,0.5)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; (e.target as HTMLElement).style.boxShadow = "0 4px 16px rgba(245,158,11,0.35)"; }}>
            Start free →
          </Link>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{display: "none", background: "none", border: "none", color: "#94A3B8", fontSize: "1.4rem", cursor: "pointer", padding: "4px"}} className="show-mobile">
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{background: "#0D1220", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "4px"}}>
          {["Features", "Exams", "Pricing"].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
              style={{fontSize: "0.95rem", color: "#94A3B8", textDecoration: "none", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
              {item}
            </Link>
          ))}
          <Link href="/login" style={{fontSize: "0.95rem", color: "#94A3B8", textDecoration: "none", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>Log in</Link>
          <Link href="/signup" style={{fontSize: "0.9rem", fontWeight: 700, color: "#080C14", textAlign: "center", padding: "12px", borderRadius: "10px", background: "linear-gradient(120deg,#F59E0B,#F97316)", textDecoration: "none", marginTop: "8px"}}>
            Start free →
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: block !important; }
          .navbar-container { padding: 0 24px !important; }
        }
        @media (max-width: 600px) {
          .navbar-container { padding: 0 18px !important; }
        }
      `}</style>
    </nav>
  );
}