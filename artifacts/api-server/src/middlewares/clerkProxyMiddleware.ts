import type { IncomingHttpHeaders } from "http";
import type { RequestHandler } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const CLERK_FAPI = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";
export function getClerkProxyHost(req: { headers: IncomingHttpHeaders }): string | undefined {
  const value = req.headers["x-forwarded-host"];
  const host = (Array.isArray(value) ? value[0] : value)?.split(",")[0]?.trim();
  return host || req.headers.host?.trim();
}
export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production" || !process.env.CLERK_SECRET_KEY) return (_req, _res, next) => next();
  return createProxyMiddleware({
    target: CLERK_FAPI, changeOrigin: true,
    pathRewrite: (path) => path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: { proxyReq: (proxyReq, req) => {
      const protocol = req.headers["x-forwarded-proto"] || "https";
      proxyReq.setHeader("Clerk-Proxy-Url", `${protocol}://${getClerkProxyHost(req)}${CLERK_PROXY_PATH}`);
      proxyReq.setHeader("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY!);
    } },
  }) as RequestHandler;
}