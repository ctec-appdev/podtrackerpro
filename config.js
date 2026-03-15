const config = {
  // REQUIRED
  appName: "PODTrackerPro",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "The NextJS boilerplate with all you need to build your SaaS, AI tool, or any other web app.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "app.podtrackerpro.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create plans in Stripe and map each monthly price ID here.
    plans: [
      {
        name: "Free",
        description: "Great for getting started",
        price: 0,
        features: [
          { name: "Manual niche, keyword, trend tracking" },
          { name: "Limited inventory tracking" },
          { name: "AI features locked" },
        ],
        isFree: true,
      },
      {
        key: "starter",
        name: "Starter",
        description: "For solo creators shipping consistently",
        price: 9.99,
        mode: "subscription",
        features: [
          { name: "Unlimited niches, keywords, inventory" },
          { name: "AI DCEB scoring" },
          { name: "AI SEO copy + trademark checks" },
          { name: "AI keyword research" },
        ],
      },
      {
        isFeatured: true,
        key: "business",
        name: "Business",
        description: "For teams and power users",
        price: 19.99,
        mode: "subscription",
        features: [
          { name: "Everything in Starter" },
          { name: "AI trend scanning" },
          { name: "AI design briefs" },
          { name: "AI research workspace" },
          { name: "Higher daily AI limits" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED - Email 'From' field to be used when sending magic login links
    fromNoReply: `PODTrackerPro <noreply@app.podtrackerpro.com>`,
    // REQUIRED - Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `PODTrackerPro <hello@app.podtrackerpro.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "support@podtrackerpro.com",
  },
  colors: {
    // REQUIRED - The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED - This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "hsl(var(--p))", // Uses the primary color from the DaisyUI theme dynamically
  },
  auth: {
    // REQUIRED - the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    callbackUrl: "/dashboard",
  },
};

export default config;
