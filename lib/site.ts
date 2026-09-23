export function getSiteUrl(): string {
  const vercelHost = process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
    : process.env.VERCEL_URL;
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

export function printfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_KEY);
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
