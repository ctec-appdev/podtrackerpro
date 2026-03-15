import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import config from "@/config"
import connectMongo from "./mongo"
import { sanitizeCallbackPath } from "./security/urls"
import { logSecurityEvent } from "./security/audit"
import { sendEmail } from "./resend"

function buildWelcomeEmail(user) {
  const firstName = user?.name?.trim()?.split(/\s+/)?.[0] || "there";
  const dashboardUrl = `https://${config.domainName}${config.auth.callbackUrl}`;
  const guideUrl = `https://${config.domainName}/dashboard`;
  const supportLine = config.resend.supportEmail
    ? `Need help? Reply to this email or contact ${config.resend.supportEmail}.`
    : "Need help? Reply to this email and we will point you in the right direction.";

  return {
    subject: "Welcome to PODTrackerPro",
    text: [
      `Welcome to PODTrackerPro, ${firstName}.`,
      "",
      "Your account is ready. PODTrackerPro is built to help you move from research to live listings in one workflow.",
      "",
      "Quick start:",
      `- Open your dashboard: ${dashboardUrl}`,
      "- Start on Dashboard: it pulls stats from your other tabs and acts as your home base",
      "- Research a niche: score a broad niche or explore sub-niches",
      "- Research keywords: generate keyword ideas with volume and competition estimates",
      "- Scan trends: track current opportunities and seasonality",
      "- Build design briefs and SEO copy",
      "- Move ideas across the board from Backlog to Posted",
      "- Track live listings and performance in Listings",
      "",
      "How the app works:",
      "- Claude AI powers DCEB scoring, keyword research, trend scanning, design briefs, and SEO copy",
      "- Your manual inputs are your ground-truth business data",
      "- Everything you save is tied to your account and persists across sessions",
      "",
      "CSV support:",
      "- Niches, Keywords, Trends, and Listings support CSV import and export",
      "- Sample CSV files are included in the app so you can see the expected format first",
      "",
      `Open the dashboard and guide here: ${guideUrl}`,
      "",
      supportLine,
    ].join("\n"),
    html: `
      <div style="margin:0; padding:24px; background:#f8fafc; font-family:Arial, sans-serif; color:#0f172a;">
        <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden;">
          <div style="padding:28px 28px 20px; background:linear-gradient(180deg, #0f172a 0%, #111827 100%);">
            <div style="font-size:12px; letter-spacing:1.4px; text-transform:uppercase; color:#93c5fd; font-weight:700; margin-bottom:10px;">
              PODTrackerPro
            </div>
            <h1 style="margin:0; font-size:28px; line-height:1.2; color:#ffffff;">
              Welcome to PODTrackerPro, ${firstName}.
            </h1>
            <p style="margin:14px 0 0; font-size:16px; line-height:1.7; color:#cbd5e1;">
              Your account is ready. PODTrackerPro is designed to help you move from niche research to posted listings in one focused workflow.
            </p>
          </div>

          <div style="padding:24px 28px;">
            <div style="margin-bottom:24px;">
              <a
                href="${dashboardUrl}"
                style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700;"
              >
                Open Dashboard
              </a>
            </div>

            <div style="margin-bottom:24px;">
              <h2 style="margin:0 0 12px; font-size:18px; color:#0f172a;">Quick Start Workflow</h2>
              <div style="display:grid; gap:12px;">
                <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                  <strong>1. Start on Dashboard</strong><br />
                  Use the Dashboard as your home base. It pulls stats from your other tabs and shows what is moving.
                </div>
                <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                  <strong>2. Research a Niche</strong><br />
                  Score a broad niche, explore sub-niches, and save the best opportunities to your tracker.
                </div>
                <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                  <strong>3. Research Keywords and Trends</strong><br />
                  Generate keyword ideas with volume and competition estimates, then scan for trends and seasonality.
                </div>
                <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                  <strong>4. Move into Design</strong><br />
                  Build design briefs, write SEO copy, and move concepts through the Ideas board from Backlog to Posted.
                </div>
                <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                  <strong>5. Track Listings</strong><br />
                  Keep your live listings, links, images, sales, and notes together in the Listings tracker.
                </div>
              </div>
            </div>

            <div style="margin-bottom:24px;">
              <h2 style="margin:0 0 12px; font-size:18px; color:#0f172a;">How Your Data Works</h2>
              <div style="display:grid; gap:12px;">
                <div style="padding:14px 16px; border-left:4px solid #2563eb; background:#eff6ff; border-radius:10px;">
                  <strong>Claude AI</strong><br />
                  Powers DCEB scoring, keyword research, trend scanning, design briefs, and SEO copy.
                </div>
                <div style="padding:14px 16px; border-left:4px solid #10b981; background:#ecfdf5; border-radius:10px;">
                  <strong>Your Manual Input</strong><br />
                  Your listings, notes, sales, and custom research are your ground-truth business data.
                </div>
                <div style="padding:14px 16px; border-left:4px solid #8b5cf6; background:#f5f3ff; border-radius:10px;">
                  <strong>Persistent Storage</strong><br />
                  Everything you save is tied to your account and persists across sessions.
                </div>
              </div>
            </div>

            <div style="margin-bottom:24px;">
              <h2 style="margin:0 0 12px; font-size:18px; color:#0f172a;">CSV Support</h2>
              <p style="margin:0; font-size:15px; line-height:1.8; color:#334155;">
                Niches, Keywords, Trends, and Listings support CSV import and export. Sample CSV downloads are included in the app so you can see the expected format before importing your own data.
              </p>
            </div>

            <div style="padding:16px; border:1px solid #dbeafe; background:#eff6ff; border-radius:12px; margin-bottom:24px;">
              <strong style="color:#1d4ed8;">Need real-time market data?</strong>
              <p style="margin:8px 0 0; font-size:15px; line-height:1.8; color:#334155;">
                PODTrackerPro is strongest for AI analysis, organization, and tracking. Live market research is still best done alongside your normal browsing workflow.
              </p>
            </div>

            <div style="margin-bottom:8px;">
              <a href="${guideUrl}" style="color:#2563eb; font-weight:700; text-decoration:none;">
                Open your dashboard and guide
              </a>
            </div>

            <p style="margin:0; font-size:14px; line-height:1.8; color:#64748b;">
              ${supportLine}
            </p>
          </div>
        </div>
      </div>
    `,
  };
}

function buildNewSignupNotificationEmail(user) {
  const signedUpAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const fullName = user?.name?.trim() || "No name provided";
  const email = user?.email?.trim() || "No email provided";
  const userId = user?.id || "Unavailable";
  const dashboardUrl = `https://${config.domainName}${config.auth.callbackUrl}`;

  return {
    subject: `New PODTrackerPro signup: ${email}`,
    text: [
      "A new user just signed up for PODTrackerPro.",
      "",
      `Name: ${fullName}`,
      `Email: ${email}`,
      `User ID: ${userId}`,
      `Signed up: ${signedUpAt}`,
      "",
      `Open dashboard: ${dashboardUrl}`,
    ].join("\n"),
    html: `
      <div style="margin:0; padding:24px; background:#f8fafc; font-family:Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden;">
          <div style="padding:24px 28px; background:linear-gradient(180deg, #0f172a 0%, #111827 100%);">
            <div style="font-size:12px; letter-spacing:1.4px; text-transform:uppercase; color:#93c5fd; font-weight:700; margin-bottom:10px;">
              PODTrackerPro
            </div>
            <h1 style="margin:0; font-size:24px; line-height:1.3; color:#ffffff;">
              New signup received
            </h1>
          </div>
          <div style="padding:24px 28px;">
            <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#334155;">
              A new user just created an account.
            </p>
            <div style="display:grid; gap:12px; margin-bottom:20px;">
              <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                <strong>Name:</strong> ${fullName}
              </div>
              <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                <strong>Email:</strong> ${email}
              </div>
              <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                <strong>User ID:</strong> ${userId}
              </div>
              <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                <strong>Signed up:</strong> ${signedUpAt}
              </div>
            </div>
            <a
              href="${dashboardUrl}"
              style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700;"
            >
              Open Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  
  // Add EmailProvider only for server-side usage (not edge-compatible)
  providers: [
    // Follow the "Login with Email" tutorial to set up your email server
    // Requires a MongoDB database. Set MONGODB_URI env variable.
    ...(connectMongo
      ? [
          EmailProvider({
            server: {
              host: "smtp.resend.com",
              port: 465,
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply,
          }),
          GoogleProvider({
            // Follow the "Login with Google" tutorial to get your credentials
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            async profile(profile) {
              return {
                id: profile.sub,
                name: profile.given_name ? profile.given_name : profile.name,
                email: profile.email,
                image: profile.picture,
                createdAt: new Date(),
              };
            },
          }),
        ]
      : []),
  ],
  
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONGODB_URI env variable.
  // Learn more about the model type: https://authjs.dev/concepts/database-models
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),

  callbacks: {
    jwt: async ({ token }) => {
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/")) {
        return `${baseUrl}${sanitizeCallbackPath(url, config.auth.callbackUrl)}`;
      }

      try {
        const parsedUrl = new URL(url);

        if (parsedUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        logSecurityEvent("auth.invalid_redirect_url", { url });
      }

      return `${baseUrl}${config.auth.callbackUrl}`;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user?.email) {
        return;
      }

      try {
        const message = buildWelcomeEmail(user);
        await sendEmail({
          to: user.email,
          subject: message.subject,
          text: message.text,
          html: message.html,
          replyTo: config.resend.supportEmail || undefined,
        });
      } catch (error) {
        console.error("Failed to send onboarding email", error);
      }

      if (!config.resend.supportEmail) {
        return;
      }

      try {
        const notification = buildNewSignupNotificationEmail(user);
        await sendEmail({
          to: config.resend.supportEmail,
          subject: notification.subject,
          text: notification.text,
          html: notification.html,
          replyTo: user.email,
        });
      } catch (error) {
        console.error("Failed to send signup notification email", error);
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: {
    signIn: "/signin",
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
}); 
