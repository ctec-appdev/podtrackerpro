import Link from "next/link";
import config from "@/config";

const Pricing = () => {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0D1B2E",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .pricing-grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(41,100,205,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(41,100,205,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .pricing-glow {
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

        .pricing-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1180px;
          background: #1B2A4A;
          border: 1px solid rgba(240,244,255,0.09);
          border-radius: 24px;
          padding: 48px 44px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
          animation: pricingFadeUp 0.5s ease both;
        }

        @keyframes pricingFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pricing-logo-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 36px;
          text-decoration: none;
        }

        .pricing-logo-icon {
          width: 36px;
          height: 36px;
          background: #2964CD;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: #fff;
          flex-shrink: 0;
        }

        .pricing-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #F0F4FF;
        }

        .pricing-logo-text span {
          color: #2964CD;
        }

        .pricing-badge-row {
          display: flex;
          justify-content: center;
        }

        .pricing-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(41,100,205,0.12);
          border: 1px solid rgba(41,100,205,0.25);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          color: #2964CD;
          letter-spacing: 0.3px;
          margin-bottom: 20px;
        }

        .pricing-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2964CD;
          animation: pricingPulse 2s ease infinite;
        }

        @keyframes pricingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .pricing-heading {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 48px;
          letter-spacing: -1px;
          line-height: 1.05;
          color: #F0F4FF;
          text-align: center;
          margin: 0 0 10px;
        }

        .pricing-subheading {
          font-size: 15px;
          font-weight: 300;
          color: rgba(240,244,255,0.55);
          text-align: center;
          line-height: 1.6;
          margin: 0 auto 36px;
          max-width: 680px;
        }

        .pricing-divider {
          height: 1px;
          background: rgba(240,244,255,0.09);
          margin-bottom: 32px;
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .pricing-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 100%;
          background: rgba(13, 27, 46, 0.86);
          border: 1px solid rgba(240,244,255,0.09);
          border-radius: 24px;
          padding: 30px 24px 24px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .pricing-card-featured {
          border-color: rgba(41,100,205,0.5);
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        }

        .pricing-popular {
          position: absolute;
          top: 18px;
          right: 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(41,100,205,0.16);
          color: #8FBCFF;
          border: 1px solid rgba(41,100,205,0.35);
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .pricing-plan-name {
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
          color: #F0F4FF;
          margin: 0;
        }

        .pricing-plan-description {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(240,244,255,0.58);
          margin: 10px 0 0;
          max-width: 26ch;
        }

        .pricing-price-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin: 28px 0 24px;
        }

        .pricing-price {
          font-family: 'Syne', sans-serif;
          font-size: 52px;
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: -1.5px;
          color: #F0F4FF;
          margin: 0;
        }

        .pricing-price-unit {
          font-size: 12px;
          line-height: 1.4;
          color: rgba(240,244,255,0.5);
          text-transform: uppercase;
          font-weight: 600;
          padding-bottom: 6px;
        }

        .pricing-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }

        .pricing-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: rgba(240,244,255,0.82);
          font-size: 14px;
          line-height: 1.55;
        }

        .pricing-feature-icon {
          width: 18px;
          height: 18px;
          color: #8FBCFF;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .pricing-actions {
          margin-top: 28px;
        }

        .pricing-actions .btn {
          width: 100%;
          min-height: 48px;
          border-radius: 12px;
          border: none;
          background: #F0F4FF;
          color: #0D1B2E;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 0 0 0 rgba(41,100,205,0);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        .pricing-actions .btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(41,100,205,0.25);
        }

        .pricing-actions .btn:disabled {
          background: rgba(240,244,255,0.08);
          color: rgba(240,244,255,0.42);
          border: 1px solid rgba(240,244,255,0.08);
          opacity: 1;
        }

        .pricing-actions .btn-outline {
          background: transparent;
          color: rgba(240,244,255,0.68);
          border: 1px solid rgba(240,244,255,0.08);
          box-shadow: none;
        }

        .pricing-billing {
          margin: 14px 0 0;
          font-size: 13px;
          text-align: center;
          line-height: 1.6;
          color: rgba(240,244,255,0.45);
        }

        .pricing-footer-strip {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 24px;
          margin-top: 32px;
          flex-wrap: wrap;
          justify-content: center;
          animation: pricingFadeUp 0.5s 0.15s ease both;
          opacity: 0;
        }

        .pricing-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(240,244,255,0.4);
          font-weight: 400;
        }

        .pricing-pill-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #2964CD;
          opacity: 0.6;
          flex-shrink: 0;
        }

        @media (max-width: 980px) {
          .pricing-shell {
            padding: 40px 28px;
          }

          .pricing-cards {
            grid-template-columns: 1fr;
          }

          .pricing-heading {
            font-size: 38px;
          }
        }

        @media (max-width: 640px) {
          .pricing-shell {
            padding: 36px 20px;
          }

          .pricing-heading {
            font-size: 30px;
          }

          .pricing-card {
            padding: 24px 18px 20px;
          }
        }
      `}</style>

      <div className="pricing-grid-bg" />
      <div className="pricing-glow" />

      <section className="pricing-shell" id="pricing">
        <Link href="/" className="pricing-logo-row">
          <div className="pricing-logo-icon">P</div>
          <span className="pricing-logo-text">
            POD Tracker <span>Pro</span>
          </span>
        </Link>

        <div className="pricing-badge-row">
          <div className="pricing-badge">
            <div className="pricing-badge-dot" />
            Simple pricing
          </div>
        </div>

        <h1 className="pricing-heading">Choose the plan that fits your workflow</h1>
        <p className="pricing-subheading">
          Start free, unlock AI tools when you need them, and keep everything in one polished workspace for your POD business.
        </p>

        <div className="pricing-divider" />

        <div className="pricing-cards">
          {config.stripe.plans.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card ${plan.isFeatured ? "pricing-card-featured" : ""}`}
            >
              {plan.isFeatured && <div className="pricing-popular">POPULAR</div>}

              <div>
                <p className="pricing-plan-name">{plan.name}</p>
                {plan.description && <p className="pricing-plan-description">{plan.description}</p>}
              </div>

              <div className="pricing-price-row">
                <p className="pricing-price">${plan.price}</p>
                <div className="pricing-price-unit">
                  USD{plan.mode === "subscription" ? "/mo" : ""}
                </div>
              </div>

              {plan.features && (
                <ul className="pricing-features">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="pricing-feature">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="pricing-feature-icon"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pricing-actions">
                {plan.isFree ? (
                  <Link href="/signup" className="btn btn-outline btn-block">
                    Get started free
                  </Link>
                ) : (
                  <a href={plan.checkoutUrl} className="btn btn-block">
                    {plan.name === "Starter" ? "Choose Starter" : "Choose Business"}
                  </a>
                )}

                <p className="pricing-billing">
                  {plan.mode === "subscription"
                    ? "Billed monthly. Cancel anytime."
                    : "One-time payment."}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="pricing-footer-strip">
        <div className="pricing-pill">
          <div className="pricing-pill-dot" />
          Secure checkout
        </div>
        <div className="pricing-pill">
          <div className="pricing-pill-dot" />
          Upgrade anytime
        </div>
        <div className="pricing-pill">
          <div className="pricing-pill-dot" />
          Built for POD sellers
        </div>
        <div className="pricing-pill">
          <div className="pricing-pill-dot" />
          AI tools included in paid plans
        </div>
      </div>
    </main>
  );
};

export default Pricing;
