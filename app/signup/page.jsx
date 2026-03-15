"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitizeCallbackPath } from "@/libs/security/urls";

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupContent />
        </Suspense>
    );
}

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = sanitizeCallbackPath(searchParams.get("callbackUrl"), "/dashboard");
    const { status } = useSession();
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");

    useEffect(() => {
        if (status === "authenticated") {
            router.replace(callbackUrl);
        }
    }, [callbackUrl, router, status]);

    const handleSignup = () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setNameError("Please enter your name.");
            return;
        }

        window.localStorage.setItem("podtrackerpro_signup_name", trimmedName);
        signIn("google", { callbackUrl });
    };

    if (status === "authenticated") {
        return null;
    }

    return (
        <main style={{
            minHeight: "100vh",
            background: "#0D1B2E",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
            position: "relative",
            overflow: "hidden",
        }}>

            {/* Google Fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Rubik:wght@700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0D1B2E; }

        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(41,100,205,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(41,100,205,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .glow {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 700px;
          background: radial-gradient(ellipse, rgba(41,100,205,0.13) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .card {
          position: relative;
          z-index: 1;
          background: #1B2A4A;
          border: 1px solid rgba(240,244,255,0.09);
          border-radius: 24px;
          padding: 48px 44px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 36px;
          text-decoration: none;
        }

        .logo-image {
          width: 240px;
          height: auto;
          display: block;
        }

        .heading {
          font-family: 'Rubik', sans-serif;
          font-weight: 800;
          font-size: 28px;
          letter-spacing: -1px;
          line-height: 1.1;
          color: #F0F4FF;
          text-align: center;
          margin-bottom: 10px;
        }

        .subheading {
          font-size: 15px;
          font-weight: 300;
          color: rgba(240,244,255,0.55);
          text-align: center;
          line-height: 1.6;
          margin-bottom: 36px;
        }

        .divider {
          height: 1px;
          background: rgba(240,244,255,0.09);
          margin-bottom: 28px;
        }

        .field-group {
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(240,244,255,0.72);
          margin-bottom: 8px;
        }

        .text-input {
          width: 100%;
          background: rgba(13,27,46,0.72);
          color: #F0F4FF;
          border: 1px solid rgba(240,244,255,0.12);
          border-radius: 12px;
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .text-input::placeholder {
          color: rgba(240,244,255,0.32);
        }

        .text-input:focus {
          border-color: rgba(41,100,205,0.9);
          box-shadow: 0 0 0 3px rgba(41,100,205,0.18);
          background: rgba(13,27,46,0.9);
        }

        .field-help {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(240,244,255,0.38);
          margin-top: 8px;
        }

        .field-error {
          font-size: 12px;
          line-height: 1.5;
          color: #FF9A9A;
          margin-top: 8px;
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #F0F4FF;
          color: #0D1B2E;
          border: none;
          border-radius: 12px;
          padding: 14px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 0 0 rgba(41,100,205,0);
          letter-spacing: -0.1px;
        }

        .google-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(41,100,205,0.25);
        }

        .google-btn:active {
          transform: translateY(0);
        }

        .google-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .terms {
          font-size: 12px;
          color: rgba(240,244,255,0.3);
          text-align: center;
          margin-top: 20px;
          line-height: 1.6;
        }

        .terms a {
          color: rgba(240,244,255,0.5);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .terms a:hover { color: #2964CD; }

        .login-row {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: rgba(240,244,255,0.4);
        }

        .login-row a {
          color: #2964CD;
          text-decoration: none;
          font-weight: 500;
          margin-left: 4px;
        }

        .login-row a:hover { text-decoration: underline; }

        .features-strip {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 24px;
          margin-top: 32px;
          flex-wrap: wrap;
          justify-content: center;
          animation: fadeUp 0.5s 0.15s ease both;
          opacity: 0;
        }

        .feature-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(240,244,255,0.4);
          font-weight: 400;
        }

        .feature-pill-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #2964CD;
          opacity: 0.6;
          flex-shrink: 0;
        }

        .plan-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(41,100,205,0.12);
          border: 1px solid rgba(41,100,205,0.25);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          color: #2964CD;
          letter-spacing: 0.3px;
          margin-bottom: 20px;
        }

        .plan-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2964CD;
          animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

            {/* Background grid */}
            <div className="grid-bg" />
            <div className="glow" />

            {/* Card */}
            <div className="card">

                {/* Logo */}
                    <Link href="/" className="logo-row">
                        <Image
                            src="/podtrackerpro-logo.png"
                            alt="PODTrackerPro logo"
                            className="logo-image"
                            width={600}
                            height={110}
                            priority
                        />
                    </Link>

                {/* Free plan badge */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="plan-badge">
                        <div className="plan-dot" />
                        Free plan — no credit card required
                    </div>
                </div>

                {/* Heading */}
                <h1 className="heading">Create your account</h1>
                <p className="subheading">
                    Start tracking your POD business across Amazon Merch, Redbubble, Etsy, and Spring — for free.
                </p>

                <div className="divider" />

                <div className="field-group">
                    <label className="field-label" htmlFor="signup-name">Full name</label>
                    <input
                        id="signup-name"
                        className="text-input"
                        type="text"
                        placeholder="Jane Doe"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (nameError) setNameError("");
                        }}
                    />
                    {nameError ? (
                        <p className="field-error">{nameError}</p>
                    ) : (
                        <p className="field-help">We&apos;ll use this for marketing and onboarding personalization.</p>
                    )}
                </div>

                {/* Google Sign In */}
                <button
                    className="google-btn"
                    onClick={handleSignup}
                >
                    {/* Google SVG icon */}
                    <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                {/* Terms */}
                <p className="terms">
                    By signing up, you agree to our{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                    {" "}and{" "}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </p>

                {/* Login link */}
                <div className="login-row">
                    Already have an account?
                    <a href="/signin">Log in</a>
                </div>
            </div>

            {/* Feature pills below card */}
            <div className="features-strip">
                <div className="feature-pill"><div className="feature-pill-dot" />Free plan forever</div>
                <div className="feature-pill"><div className="feature-pill-dot" />All 4 platforms</div>
                <div className="feature-pill"><div className="feature-pill-dot" />No credit card</div>
                <div className="feature-pill"><div className="feature-pill-dot" />Cancel anytime</div>
            </div>

        </main>
    );
}



