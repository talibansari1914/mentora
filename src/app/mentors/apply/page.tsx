"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/constants/mentors";
import { mentorService } from "@/services/mentorService";
import { MentorApplication, MentorCategory, MentorType } from "@/types/mentor";
import { Zap, CheckCircle2 } from "lucide-react";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const MENTOR_TYPES: { value: MentorType; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Both" },
];

const STATUS_INFO: Record<string, { color: string; text: string }> = {
  pending: { color: "#D97706", text: "Your application is under review. We'll notify you once it's decided." },
  approved: { color: "#059669", text: "Your application was approved! Your mentor profile is now live." },
  rejected: { color: "#EF4444", text: "Your application wasn't approved this time." },
};

export default function BecomeMentorPage() {
  const [existingApplication, setExistingApplication] = useState<MentorApplication | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<MentorCategory>("academic");
  const [mentorType, setMentorType] = useState<MentorType>("online");
  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState(1);
  const [expertise, setExpertise] = useState("");
  const [languages, setLanguages] = useState("English");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [sessionCharge, setSessionCharge] = useState(299);

  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    mentorService
      .getMyApplication()
      .then(setExistingApplication)
      .catch(() => setExistingApplication(null))
      .finally(() => setCheckingExisting(false));
  }, []);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — generous for a photo/scan of an ID or certificate

  async function handleSubmit() {
    if (!name.trim() || !qualification.trim() || !expertise.trim() || !bio.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (mentorType !== "online" && !city.trim()) {
      setError("City is required for offline/hybrid mentoring.");
      return;
    }
    if (!idProofFile) {
      setError("Please upload a government ID proof.");
      return;
    }
    if (idProofFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`Your ID proof file is too large (max 5MB). "${idProofFile.name}" is ${(idProofFile.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    const oversizedCertificate = certificateFiles.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversizedCertificate) {
      setError(`"${oversizedCertificate.name}" is too large (max 5MB per file). Please compress it or upload a smaller scan.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      setUploadingDocs(true);
      const idProofPath = await mentorService.uploadMentorDocument(idProofFile, "idproof");
      const certificatePaths = await Promise.all(
        certificateFiles.map((file) => mentorService.uploadMentorDocument(file, "certificate"))
      );
      setUploadingDocs(false);

      await mentorService.submitApplication({
        name: name.trim(),
        category,
        mentor_type: mentorType,
        qualification: qualification.trim(),
        experience_years: experienceYears,
        expertise: expertise.trim(),
        languages: languages.trim(),
        bio: bio.trim(),
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        session_charge: sessionCharge,
        id_proof_path: idProofPath,
        certificate_paths: certificatePaths,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not submit your application."));
    } finally {
      setSubmitting(false);
      setUploadingDocs(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--theme-card-bg)",
    border: "1px solid var(--theme-border)",
    borderRadius: "12px",
    padding: "12px 14px",
    color: "var(--theme-text-main)",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "var(--theme-text-sub)",
    fontSize: "0.78rem",
    fontWeight: 700,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  if (checkingExisting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--theme-bg-main)",
          color: "var(--theme-text-sub)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (submitted || existingApplication) {
    const status = existingApplication?.status ?? "pending";
    const info = STATUS_INFO[status];
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--theme-bg-main)",
          color: "var(--theme-text-main)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "var(--theme-card-bg)",
            border: "1px solid var(--theme-border)",
            borderRadius: "24px",
            padding: "clamp(24px, 5vw, 40px)",
            textAlign: "center",
            maxWidth: "460px",
            width: "100%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>
            {status === "approved" ? "🎉" : status === "rejected" ? "😕" : "⏳"}
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "10px", color: "var(--theme-text-main)" }}>
            {submitted ? "Application Submitted!" : "You've Already Applied"}
          </h2>
          <p style={{ color: info.color, fontSize: "0.9rem", marginBottom: "24px", lineHeight: 1.6, fontWeight: 600 }}>
            {info.text}
          </p>
          <Link
            href="/mentors"
            style={{
              display: "inline-block",
              background: "var(--theme-accent)",
              color: "var(--theme-accent-text)",
              padding: "12px 24px",
              borderRadius: "14px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 14px var(--theme-accent-glow)",
            }}
          >
            ← Back to Mentors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--theme-bg-main)",
        color: "var(--theme-text-main)",
        fontFamily: "'Inter', sans-serif",
        paddingBottom: "60px",
        boxSizing: "border-box",
      }}
    >
      {/* Top Navbar */}
      <nav
        style={{
          background: "var(--theme-card-bg)",
          borderBottom: "1px solid var(--theme-border)",
          padding: "14px clamp(16px, 4vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "var(--theme-text-main)",
            fontWeight: 800,
            fontSize: "1.2rem",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "var(--theme-accent)",
              color: "var(--theme-accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            <Zap size={16} style={{ color: "var(--theme-accent-text)" }} />
          </div>
          Mentora
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/mentors"
            style={{ color: "var(--theme-text-sub)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
          >
            Browse Mentors
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "760px", margin: "32px auto 0 auto", padding: "0 16px", boxSizing: "border-box" }}>
        <div style={{ marginBottom: "16px" }}>
          <BackToDashboardLink href="/mentors" label="Back to Mentors" />
        </div>

        <header style={{ margin: "14px 0 24px" }}>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2rem)",
              fontWeight: 800,
              marginBottom: "8px",
              color: "var(--theme-text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            Become a <span style={{ color: "var(--theme-accent)" }}>Mentor</span>
          </h1>
          <p style={{ color: "var(--theme-text-sub)", fontSize: "0.95rem", fontWeight: 500 }}>
            Share your expertise and help students on Mentora. Applications are reviewed manually.
          </p>
        </header>

        <div
          style={{
            background: "var(--theme-card-bg)",
            border: "1px solid var(--theme-border)",
            borderRadius: "24px",
            padding: "clamp(20px, 4vw, 36px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as MentorCategory)} style={inputStyle}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mentoring Mode</label>
              <select value={mentorType} onChange={(e) => setMentorType(e.target.value as MentorType)} style={inputStyle}>
                {MENTOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Qualification</label>
            <input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. M.Sc Physics, IIT Delhi" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <input type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Session Charge (₹)</label>
              <input type="number" min={0} value={sessionCharge} onChange={(e) => setSessionCharge(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Expertise (comma-separated)</label>
            <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g. UPSC, Polity, Governance" style={inputStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Languages (comma-separated)</label>
            <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="e.g. Hindi, English" style={inputStyle} />
          </div>

          {mentorType !== "online" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. New Delhi" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Connaught Place" style={inputStyle} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell students about yourself and your teaching style..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ borderTop: "1px solid var(--theme-border)", paddingTop: "24px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "6px", color: "var(--theme-text-main)" }}>
              Verification Documents
            </h3>
            <p style={{ color: "var(--theme-text-sub)", fontSize: "0.8rem", marginBottom: "16px", fontWeight: 500 }}>
              Kept private — only used to verify your identity and qualifications for approval.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Government ID Proof (PAN / Passport, etc.)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdProofFile(e.target.files?.[0] ?? null)}
                style={{ ...inputStyle, padding: "10px 14px", cursor: "pointer" }}
              />
              {idProofFile && (
                <p style={{ color: "#059669", fontSize: "0.8rem", marginTop: "6px", fontWeight: 600 }}>
                  ✓ {idProofFile.name}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Certificates (Degree, e.g. B.Tech / M.Tech / PhD)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => setCertificateFiles(e.target.files ? Array.from(e.target.files) : [])}
                style={{ ...inputStyle, padding: "10px 14px", cursor: "pointer" }}
              />
              {certificateFiles.length > 0 && (
                <p style={{ color: "#059669", fontSize: "0.8rem", marginTop: "6px", fontWeight: 600 }}>
                  ✓ {certificateFiles.length} file{certificateFiles.length !== 1 ? "s" : ""} selected: {certificateFiles.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>
          </div>

          {error && <p style={{ color: "#EF4444", fontSize: "0.88rem", marginBottom: "16px", fontWeight: 600 }}>⚠️ {error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              background: "var(--theme-accent)",
              border: "none",
              color: "var(--theme-accent-text)",
              padding: "14px",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              boxShadow: "0 4px 16px var(--theme-accent-glow)",
            }}
          >
            {uploadingDocs ? "Uploading documents..." : submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}