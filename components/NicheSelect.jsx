"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export const DEFAULT_NICHE_OPTIONS = [
  "Occupations & Jobs",
  "Hobbies & Interests",
  "Pets & Animals",
  "Family & Relationships",
  "Fitness & Sports",
  "Food & Drink",
  "Humor & Memes",
  "Pop Culture & Fandoms",
  "Causes & Activism",
  "Faith & Spirituality",
  "Lifestyle & Aesthetics",
  "Holidays & Events",
  "Travel & Adventure",
  "Local & Regional Pride",
  "Other / Not Sure Yet",
];

export function normalizeNicheOptionLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export default function NicheSelect({
  value,
  onChange,
  presetOptions = DEFAULT_NICHE_OPTIONS,
  customOptions = [],
  onAddCustom,
  onRenameCustom,
  onDeleteCustom,
  placeholder = "Pick or type a niche",
  colors,
  fontFamily,
}) {
  const palette = {
    card: colors?.card || "#111827",
    surface: colors?.surface || "#0f172a",
    border: colors?.border || "#334155",
    accent: colors?.accent || "#22c55e",
    accentDim: colors?.accentDim || "rgba(34, 197, 94, 0.4)",
    text: colors?.text || "#e5e7eb",
    textMuted: colors?.textMuted || "#94a3b8",
    danger: colors?.danger || "#ef4444",
  };

  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const normalizedQuery = normalizeNicheOptionLabel(query);
  const combinedOptions = useMemo(
    () => [...presetOptions, ...customOptions],
    [presetOptions, customOptions]
  );
  const filteredPresetOptions = useMemo(
    () =>
      presetOptions.filter(
        (option) => !normalizedQuery || option.toLowerCase().includes(normalizedQuery.toLowerCase())
      ),
    [normalizedQuery, presetOptions]
  );
  const filteredCustomOptions = useMemo(
    () =>
      customOptions.filter(
        (option) => !normalizedQuery || option.toLowerCase().includes(normalizedQuery.toLowerCase())
      ),
    [normalizedQuery, customOptions]
  );
  const hasExactMatch = combinedOptions.some(
    (option) => normalizeNicheOptionLabel(option).toLowerCase() === normalizedQuery.toLowerCase()
  );

  const selectValue = (nextValue) => {
    onChange(nextValue);
    setQuery(nextValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          onChange(nextValue);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 6,
          padding: "8px 12px",
          color: palette.text,
          fontFamily,
          fontSize: 15,
          outline: "none",
          width: "100%",
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxHeight: 280, overflowY: "auto", padding: 8 }}>
            {!hasExactMatch && normalizedQuery && (
              <button
                type="button"
                onClick={() => {
                  onAddCustom?.(normalizedQuery);
                  selectValue(normalizedQuery);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: `1px dashed ${palette.accentDim}`,
                  background: palette.surface,
                  color: palette.accent,
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  marginBottom: 8,
                  fontFamily,
                  fontSize: 14,
                }}
              >
                + Add &quot;{normalizedQuery}&quot; as a custom niche
              </button>
            )}

            <div
              style={{
                color: palette.textMuted,
                fontFamily,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                padding: "4px 6px",
              }}
            >
              Preset Niches
            </div>
            {filteredPresetOptions.length ? (
              filteredPresetOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectValue(option)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background:
                      normalizeNicheOptionLabel(value).toLowerCase() ===
                      normalizeNicheOptionLabel(option).toLowerCase()
                        ? "rgba(255,255,255,0.05)"
                        : "transparent",
                    color: palette.text,
                    borderRadius: 8,
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontFamily,
                    fontSize: 14,
                  }}
                >
                  {option}
                </button>
              ))
            ) : (
              <div style={{ color: palette.textMuted, fontSize: 13, padding: "8px 12px" }}>
                No preset matches.
              </div>
            )}

            <div
              style={{
                color: palette.textMuted,
                fontFamily,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                padding: "10px 6px 4px",
              }}
            >
              Custom Niches
            </div>
            {filteredCustomOptions.length ? (
              filteredCustomOptions.map((option) => (
                <div
                  key={option}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto auto",
                    gap: 8,
                    alignItems: "center",
                    padding: "6px 4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => selectValue(option)}
                    style={{
                      textAlign: "left",
                      border: "none",
                      background:
                        normalizeNicheOptionLabel(value).toLowerCase() ===
                        normalizeNicheOptionLabel(option).toLowerCase()
                          ? "rgba(255,255,255,0.05)"
                          : "transparent",
                      color: palette.text,
                      borderRadius: 8,
                      padding: "10px 8px",
                      cursor: "pointer",
                      fontFamily,
                      fontSize: 14,
                    }}
                  >
                    {option}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRenameCustom?.(option)}
                    style={{
                      border: `1px solid ${palette.border}`,
                      background: palette.surface,
                      color: palette.textMuted,
                      borderRadius: 8,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontFamily,
                      fontSize: 12,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCustom?.(option);
                      if (
                        normalizeNicheOptionLabel(value).toLowerCase() ===
                        normalizeNicheOptionLabel(option).toLowerCase()
                      ) {
                        onChange("");
                        setQuery("");
                      }
                    }}
                    style={{
                      border: `1px solid ${palette.border}`,
                      background: palette.surface,
                      color: palette.danger,
                      borderRadius: 8,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontFamily,
                      fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <div style={{ color: palette.textMuted, fontSize: 13, padding: "8px 12px" }}>
                No custom niches yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
