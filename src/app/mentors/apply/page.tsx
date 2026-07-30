"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { G } from "@/constants/colors";
import { CATEGORIES } from "@/constants/mentors";
import { mentorService } from "@/services/mentorService";
import { MentorApplication, MentorCategory, MentorType } from "@/types/mentor";

const MENTOR_TYPES: { value: MentorType; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Both" },
];

const STATUS_INFO: Record<string, { color: string; text: string }> = {
  pending: { color: "#F59E0B", text: "Your application is under review. We'll notify you once it's decided." },
  approved: { color: "#22C55E", text: "Your application was approved! Your mentor profile is now live." },
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
    } catch (err: any) {
      setError(err.message ?? "Could not submit your application.");
    } finally {
      setSubmitting(false);
      setUploadingDocs(false);
    }
  }

  const inputStyle: React.CSSProperties = {
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#94A3B8",
    fontSize: ".78rem",
    fontWeight: 600,
    marginBottom: "6px",
    textTransform: "uppercase",
  };

  if (checkingExisting) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
      </div>
    );
  }

  if (submitted || existingApplication) {
    const status = existingApplication?.status ?? "pending";
    const info = STATUS_INFO[status];
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ ...G.card, padding: "40px", textAlign: "center", maxWidth: "460px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{status === "approved" ? "🎉" : status === "rejected" ? "😕" : "⏳"}</div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "10px" }}>
            {submitted ? "Application Submitted!" : "You've Already Applied"}
          </h2>
          <p style={{ color: info.color, fontSize: ".9rem", marginBottom: "24px", lineHeight: 1.6 }}>{info.text}</p>
          <Link href="/mentors" style={{ display: "inline-block", background: G.grad, color: "#111827", padding: "12px 24px", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
            ← Back to Mentors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif", padding: "32px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <Link href="/mentors" style={{ color: "#64748B", fontSize: ".85rem", textDecoration: "none" }}>
          ← Back to Mentors
        </Link>

        <header style={{ margin: "14px 0 22px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            Become a <span style={G.gradText}>Mentor</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Share your expertise and help students on Mentora. Applications are reviewed manually.
          </p>
        </header>

        <div style={{ ...G.card, padding: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
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

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Qualification</label>
            <input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. M.Sc Physics, IIT Delhi" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <input type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Session Charge (₹)</label>
              <input type="number" min={0} value={sessionCharge} onChange={(e) => setSessionCharge(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Expertise (comma-separated)</label>
            <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g. UPSC, Polity, Governance" style={inputStyle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Languages (comma-separated)</label>
            <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="e.g. Hindi, English" style={inputStyle} />
          </div>

          {mentorType !== "online" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell students about yourself and your teaching style..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "20px", marginBottom: "20px" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>Verification Documents</h3>
            <p style={{ color: "#64748B", fontSize: ".78rem", marginBottom: "16px" }}>
              Kept private — only used to verify your identity and qualifications for approval.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Government ID Proof (Aadhaar / PAN / Passport, etc.)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdProofFile(e.target.files?.[0] ?? null)}
                style={{ ...inputStyle, padding: "8px 14px" }}
              />
              {idProofFile && <p style={{ color: "#22C55E", fontSize: ".78rem", marginTop: "6px" }}>✓ {idProofFile.name}</p>}
            </div>

            <div>
              <label style={labelStyle}>Certificates (Degree, e.g. B.Tech / M.Tech / PhD)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => setCertificateFiles(e.target.files ? Array.from(e.target.files) : [])}
                style={{ ...inputStyle, padding: "8px 14px" }}
              />
              {certificateFiles.length > 0 && (
                <p style={{ color: "#22C55E", fontSize: ".78rem", marginTop: "6px" }}>
                  ✓ {certificateFiles.length} file{certificateFiles.length !== 1 ? "s" : ""} selected: {certificateFiles.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>
          </div>

          {error && <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "#111827",
              padding: "13px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: ".95rem",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {uploadingDocs ? "Uploading documents..." : submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>

      </div>
    </div>
  );
}