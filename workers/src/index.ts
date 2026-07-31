import { handleGetRecipes } from "./recipes";
import { sendMenuReadyWhatsApp } from "./twilio";
import { CORS_HEADERS, badRequest, json, type Env } from "./types";
import { handleGenerateWeeklyPlan } from "./weekly-plan";

/**
 * Mi Menú Smart API Worker — independiente de Senior Safe.
 * POST /recipes | POST /weekly-plan | POST /notify/whatsapp
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (request.method === "GET" && (path === "/" || path === "")) {
        return json({
          app: env.APP_NAME ?? "Mi Menú Smart",
          ok: true,
          endpoints: ["POST /recipes", "POST /weekly-plan", "POST /notify/whatsapp"],
        });
      }

      if (request.method === "POST" && (path === "/recipes" || path.endsWith("/recipes"))) {
        return handleGetRecipes(request, env);
      }

      if (
        request.method === "POST" &&
        (path === "/weekly-plan" || path.endsWith("/weekly-plan"))
      ) {
        return handleGenerateWeeklyPlan(request, env);
      }

      if (
        request.method === "POST" &&
        (path === "/notify/whatsapp" || path.endsWith("/notify/whatsapp"))
      ) {
        const body = (await request.json()) as { recipient?: string };
        if (!body.recipient) return badRequest("recipient requerido");
        const result = await sendMenuReadyWhatsApp(env, body.recipient);
        return json(result, result.ok ? 200 : 502);
      }

      return json({ error: "Not found" }, 404);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Error interno" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
