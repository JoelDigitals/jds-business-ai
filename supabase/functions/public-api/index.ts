import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

type Tool = "business" | "imprint" | "privacy" | "legal" | "contract" | "general";

function buildSystem(lang: string, tool: Tool) {
  const langName = lang === "en" ? "English" : "German (Deutsch)";
  const base = `You are JDS Business AI, an expert business & legal assistant integrated into JDS Management. Always respond in ${langName}. Use rich markdown (## headings, **bold**, lists, tables, code blocks).`;
  switch (tool) {
    case "business":  return base + " You are a senior strategy consultant producing structured, actionable business plans.";
    case "imprint":   return base + " You generate German TMG/DDG-compliant Impressum text.";
    case "privacy":   return base + " You generate GDPR-compliant privacy policies.";
    case "legal":     return base + " You provide business legal guidance. Always include a disclaimer that it is not formal legal advice.";
    case "contract":  return base + " You draft professional contracts with all standard clauses.";
    default:          return base + " Help with strategy, marketing, finance, legal, operations and any business question.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    // --- Auth via API key ---
    const auth = req.headers.get("Authorization") ?? "";
    const headerKey = req.headers.get("x-api-key");
    const rawKey = headerKey ?? (auth.startsWith("Bearer ") ? auth.slice(7) : "");
    if (!rawKey || !rawKey.startsWith("jds_")) return json({ error: "missing_api_key" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const hash = await sha256(rawKey);
    const { data: ownerId, error: vErr } = await supabaseAdmin.rpc("verify_api_key", { _hash: hash });
    if (vErr || !ownerId) return json({ error: "invalid_api_key" }, 401);

    await supabaseAdmin.rpc("touch_api_key", { _hash: hash });

    // --- Route ---
    const url = new URL(req.url);
    // Path looks like /public-api/chat or /public-api/document
    const parts = url.pathname.split("/").filter(Boolean);
    const action = parts[parts.length - 1];

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const lang = (body.lang as string) || "de";
    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) return json({ error: "ai_not_configured" }, 500);

    let messages: Array<{ role: string; content: unknown }> = [];
    let tool: Tool = "general";

    if (action === "chat") {
      // { messages: [{role, content}], lang?, system? }
      const msgs = Array.isArray(body.messages) ? body.messages : null;
      if (!msgs || msgs.length === 0) return json({ error: "messages_required" }, 400);
      messages = [
        { role: "system", content: (body.system as string) || buildSystem(lang, "general") },
        ...msgs as any,
      ];
    } else if (action === "document") {
      // { tool: business|imprint|privacy|legal|contract, input: {...}, lang? }
      tool = (body.tool as Tool) || "business";
      const input = (body.input as Record<string, string>) || {};
      let userMsg = "";
      switch (tool) {
        case "business":
          userMsg = `Create a comprehensive business plan. Sections: Executive Summary, Business Idea, Market Analysis, Target Audience, Competitive Analysis, Marketing Strategy, Operations, Financial Plan, Risks, Roadmap.\n\nIdea: ${input.idea ?? ""}\nIndustry: ${input.industry ?? ""}\nTarget audience: ${input.target ?? ""}`;
          break;
        case "imprint":
          userMsg = `Generate a legally compliant Impressum (German law).\nCompany: ${input.company ?? ""}\nOwner/Director: ${input.owner ?? ""}\nAddress: ${input.address ?? ""}\nEmail: ${input.email ?? ""}\nPhone: ${input.phone ?? ""}`;
          break;
        case "privacy":
          userMsg = `Generate a complete GDPR-compliant privacy policy.\nWebsite: ${input.website ?? ""}\nController: ${input.company ?? ""}\nTools: ${input.tools ?? ""}`;
          break;
        case "legal":
          userMsg = `Answer this business legal question:\n\n${input.question ?? ""}\n\nStructure: Brief Answer, Detailed Explanation, Relevant Laws, Next Steps, Disclaimer.`;
          break;
        case "contract":
          userMsg = `Draft a professional contract.\nType: ${input.contractType ?? ""}\nParties: ${input.parties ?? ""}\nDetails: ${input.details ?? ""}\n\nInclude all standard clauses.`;
          break;
        default:
          return json({ error: "invalid_tool" }, 400);
      }
      messages = [
        { role: "system", content: buildSystem(lang, tool) },
        { role: "user", content: userMsg },
      ];
    } else {
      return json({ error: "unknown_action", hint: "Use /public-api/chat or /public-api/document" }, 404);
    }

    const model = (body.model as string) || "google/gemini-2.5-flash";
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI error", resp.status, txt);
      if (resp.status === 429) return json({ error: "rate_limit" }, 429);
      if (resp.status === 402) return json({ error: "ai_credits" }, 402);
      return json({ error: "ai_error" }, 502);
    }

    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    // Persist document when action=document
    let documentId: string | null = null;
    if (action === "document") {
      const title = (body.title as string) || `${tool} (API)`;
      const { data: inserted } = await supabaseAdmin.from("documents").insert({
        user_id: ownerId,
        type: tool,
        title,
        content,
      }).select("id").single();
      documentId = inserted?.id ?? null;
    }

    return json({ content, documentId, model, action });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
