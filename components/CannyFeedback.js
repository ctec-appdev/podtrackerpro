"use client";

export default function CannyFeedback() {
  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px", color: "#f8fafc" }}>Improve PTP</h1>
      <p style={{ color: "#94a3b8", fontSize: 16, margin: "0 0 24px", lineHeight: 1.7 }}>
        The feedback board is temporarily disabled while the Canny integration is being fixed.
      </p>
      <div
        style={{
          background: "#131a25",
          border: "1px solid #263243",
          borderRadius: 10,
          padding: 20,
          color: "#94a3b8",
          lineHeight: 1.7,
        }}
      >
        Re-enable this component after the Canny file and deployment encoding issue are resolved.
      </div>
    </div>
  );
}
