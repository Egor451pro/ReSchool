export function applySecurityHeaders(headers: Headers, isProd: boolean): void {
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://nominatim.openstreetmap.org",
      "object-src 'none'",
    ].join("; "),
  );
  if (isProd) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}
