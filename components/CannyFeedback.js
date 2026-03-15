"use client";

const BOARD_URL = "https://podtrackerpro.canny.io/feature-requests";

export default function CannyFeedback() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px", color: "#f8fafc" }}>Improve PTP</h1>
          <p style={{ color: "#94a3b8", fontSize: 16, margin: 0, lineHeight: 1.7 }}>
            Share feature requests, vote on ideas, and track what should be built next.
          </p>
        </div>
        <a
          href={BOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #263243",
            background: "#131a25",
            color: "#60a5fa",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Open In Canny
        </a>
      </div>

      <div
        style={{
          background: "#131a25",
          border: "1px solid #263243",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <iframe
          src={BOARD_URL}
          title="PODTrackerPro feature requests"
          style={{
            width: "100%",
            minHeight: "78vh",
            border: "none",
            display: "block",
            background: "#131a25",
          }}
        />
      </div>
    </div>
  );
}
