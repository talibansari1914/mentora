"use client";

import React, { useState, useEffect, useRef } from 'react';
import { TextToAudioConfigState } from '../types';
import { FileText, Trash2, Upload, Clipboard } from 'lucide-react';

export interface TextEditorProps {
  config?: TextToAudioConfigState;
  onChange: (key: keyof TextToAudioConfigState, value: any) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Internal state prevents box from freezing
  const [localText, setLocalText] = useState<string>(config?.text || '');

  // Keep localText synced with parent config
  useEffect(() => {
    if (config?.text !== undefined && config.text !== localText) {
      setLocalText(config.text);
    }
  }, [config?.text]);

  // Handle manual typing
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalText(value);
    onChange('text', value);
  };

  // Clear text
  const handleClear = () => {
    setLocalText('');
    onChange('text', '');
  };

  // Clipboard Paste button
  const handleClipboardPaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        const updated = localText ? `${localText}\n${clipText}` : clipText;
        setLocalText(updated);
        onChange('text', updated);
      }
    } catch (err) {
      alert("Clipboard access denied by browser. Please click inside the box and press Ctrl+V / Cmd+V.");
    }
  };

  // File Upload (.txt, .md, .doc, .docx, .pdf)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle PDF files safely using standard dynamic import and built-in worker setup
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        
        // Use matching unpkg worker source to prevent network/module resolution crashes
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }

        const cleanContent = fullText.trim();
        if (!cleanContent) {
          alert("Could not extract plain text from this PDF. Please copy-paste the content directly.");
          e.target.value = '';
          return;
        }

        const updated = localText ? `${localText}\n\n${cleanContent}` : cleanContent;
        setLocalText(updated);
        onChange('text', updated);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        alert("Failed to read PDF content. Please copy-paste text directly.");
      }
    } else {
      // Handle standard text / markdown files
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawContent = event.target?.result as string;
        if (rawContent) {
          const cleanContent = rawContent
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
            .trim();

          if (!cleanContent) {
            alert("Could not extract plain text from this document. Please copy-paste the content directly.");
            return;
          }

          const updated = localText ? `${localText}\n\n${cleanContent}` : cleanContent;
          setLocalText(updated);
          onChange('text', updated);
        }
      };

      reader.readAsText(file);
    }

    e.target.value = '';
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* Header & Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={18} style={{ color: "#3B82F6" }} />
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#F8FAFC" }}>
            Input Text or Document Content
          </span>
        </div>

        {/* Buttons: Upload, Paste, Clear */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.doc,.docx,.pdf"
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#3B82F6",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Upload size={14} /> Upload Doc/PDF
          </button>

          <button
            type="button"
            onClick={handleClipboardPaste}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#F8FAFC",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Clipboard size={14} /> Paste
          </button>

          {localText.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "transparent",
                border: "none",
                color: "#EF4444",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          value={localText}
          onChange={handleTextChange}
          placeholder="Type here, paste text using Ctrl+V or the Paste button, or upload a document file..."
          rows={7}
          style={{
            width: "100%",
            background: "#0B132B",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "14px 16px",
            color: "#F8FAFC",
            fontSize: "0.92rem",
            lineHeight: "1.6",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "14px",
            fontSize: "0.75rem",
            color: "#64748B",
            pointerEvents: "none"
          }}
        >
          {localText.length} chars
        </div>
      </div>
    </div>
  );
};