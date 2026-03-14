/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'" + (isDevelopment ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://pbs.twimg.com https://images.unsplash.com https://logos-world.net",
  "connect-src 'self' https://api.canny.io https://canny.io https://*.canny.io",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com https://accounts.google.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // NextJS <Image> component needs to whitelist domains for src={}
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https", 
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Enforce HTTPS after the first secure visit in production deployments.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Prevent clickjacking.
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Stop MIME-type sniffing.
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Limit referrer leakage on cross-origin navigations.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Reduce high-risk browser features the app does not need.
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
          },
          // Apply a conservative baseline CSP while allowing Next.js hydration and Google Fonts.
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
  webpack: (config, { webpack, isServer }) => {
    // Ignore MongoDB's optional dependencies to prevent build warnings
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(kerberos|@mongodb-js\/zstd|@aws-sdk\/credential-providers|gcp-metadata|snappy|socks|aws4|mongodb-client-encryption)$/,
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
