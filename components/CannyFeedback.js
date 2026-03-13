"use client";

import { useEffect, useRef, useState } from "react";

const CANNY_APP_ID = process.env.NEXT_PUBLIC_CANNY_APP_ID || "";
const CANNY_BOARD_TOKEN = process.env.NEXT_PUBLIC_CANNY_BOARD_TOKEN || "";
const CANNY_PORTAL_URL = process.env.NEXT_PUBLIC_CANNY_PORTAL_URL || "";

function loadCannySdk() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Canny can only load in the browser."));
      return;
    }

    if (typeof window.Canny === "function") {
      resolve(window.Canny);
      return;
    }

    const existing = document.getElementById("canny-jssdk");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Canny), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Canny SDK.")), { once: true });
      return;
    }

    window.Canny = window.Canny || function cannyQueue() {
      window.Canny.q = window.Canny.q || [];
      window.Canny.q.push(arguments);
    };

    const script = document.createElement("script");
    script.id = "canny-jssdk";
    script.async = true;
    script.src = "https://sdk.canny.io/sdk.js";
    script.onload = () => resolve(window.Canny);
    script.onerror = () => reject(new Error("Failed to load Canny SDK."));
    document.body.appendChild(script);
  });
}

export default function CannyFeedback() {
  const widgetRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!CANNY_BOARD_TOKEN) {
      return;
    }

    let cancelled = false;

    const widgetNode = widgetRef.current;
    async function boot() {
      try {
        setStatus("loading");
        setError("");
        await loadCannySdk();

        let identifyPayload = null;
        if (CANNY_APP_ID) {
          const res = await fetch("/api/canny/identify", { cache: "no-store" });
          if (res.ok) {
            identifyPayload = await res.json();
          }
        }

        if (cancelled || !widgetNode || typeof window.Canny !== "function") {
          return;
        }

        widgetNode.innerHTML = "";

        if (identifyPayload?.user && CANNY_APP_ID) {
          const identifyArgs = {
            appID: CANNY_APP_ID,
            user: identifyPayload.user,
          };

          if (identifyPayload.hash) {
            identifyArgs.hash = identifyPayload.hash;
          }

          window.Canny("identify", identifyArgs);
        }

        window.Canny("render", {
          boardToken: CANNY_BOARD_TOKEN,
          theme: "dark",
        });

        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load feedback board.");
          setStatus("error");
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
      if (widgetNode) {
        widgetNode.innerHTML = "";
      }
    };
  }, []);

  if (!CANNY_BOARD_TOKEN) {
    return (
      <div style={{ background: "#131a25", border: "1px solid #263243", borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#f8fafc" }}>Improve PTP</h2>
        <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          Add `NEXT_PUBLIC_CANNY_BOARD_TOKEN` in Vercel to embed your feedback board here. If you want users to be auto-identified, also add `NEXT_PUBLIC_CANNY_APP_ID` and `CANNY_API_KEY`.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px", color: "#f8fafc" }}>Improve PTP</h1>
          <p style={{ color: "#94a3b8", fontSize: 16, margin: 0, lineHeight: 1.7 }}>
            Share feedback, vote on ideas, and help shape the next version of PODTrackerPro.
          </p>
        </div>
        {CANNY_PORTAL_URL ? (
          <a
            href={CANNY_PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            data-canny-link
            style={{ color: "#22c55e", textDecoration: "none", fontWeight: 600 }}
          >
            Open full board -&gt;
          </a>
        ) : null}
      </div>

      {status === "loading" ? (
        <div style={{ color: "#94a3b8", marginBottom: 12 }}>Loading feedback board…</div>
      ) : null}

      {status === "error" ? (
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: 10, padding: 16, color: "#fecaca", marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      <div
        ref={widgetRef}
        data-canny
        style={{ minHeight: 720, background: "#131a25", border: "1px solid #263243", borderRadius: 10, overflow: "hidden" }}
      />
    </div>
  );
}

