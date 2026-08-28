import { createFileRoute } from "@tanstack/react-router";
import { browsePage } from "@/lib/media-server";

export const Route = createFileRoute("/api/browse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const parsed = new URL(request.url);
        const url = parsed.searchParams.get("url");
        const shields = parsed.searchParams.get("shields") !== "0";
        if (!url) return new Response("Missing url", { status: 400 });
        try {
          return await browsePage(url, shields);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Browse failed";
          return new Response(
            `<!doctype html><html><body style="font-family:system-ui;background:#09090b;color:#f4f4f1;padding:32px">
              <h1 style="font-size:18px">This page could not be opened</h1>
              <p style="color:#a1a19a">${message}</p>
            </body></html>`,
            { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
          );
        }
      },
    },
  },
});
