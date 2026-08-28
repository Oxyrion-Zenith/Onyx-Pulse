import { createFileRoute } from "@tanstack/react-router";
import { extractMedia } from "@/lib/media-server";

export const Route = createFileRoute("/api/extract")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url) return Response.json({ error: "Missing url" }, { status: 400 });
        try {
          const result = await extractMedia(url);
          return Response.json(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Extract failed";
          return Response.json({ error: message }, { status: 400 });
        }
      },
      POST: async ({ request }) => {
        let body: { url?: string } = {};
        try {
          body = (await request.json()) as { url?: string };
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (!body.url) return Response.json({ error: "Missing url" }, { status: 400 });
        try {
          const result = await extractMedia(body.url);
          return Response.json(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Extract failed";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
