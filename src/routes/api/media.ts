import { createFileRoute } from "@tanstack/react-router";
import { proxyMedia } from "@/lib/media-server";

export const Route = createFileRoute("/api/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url) return new Response("Missing url", { status: 400 });
        try {
          return await proxyMedia(url);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Proxy failed";
          return new Response(message, { status: 400 });
        }
      },
    },
  },
});
