import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const TOOL_COST: Record<string, number> = {
  business: 5,
  contract: 4,
  privacy: 3,
  imprint: 2,
  legal: 2,
};

type Tool = "business" | "imprint" | "privacy" | "legal" | "contract";

function buildPrompt(tool: Tool, lang: string, input: Record<string, string>) {
  const langName = lang === "en" ? "English" : "German (Deutsch)";
  const sys = `You are JDS Business AI, an expert business and legal AI assistant. Always respond in ${langName}. Format your output with markdown headings (## for sections, ### for sub) and clear paragraphs. Be thorough but precise.`;

  switch (tool) {
    case "business":
      return {
        sys: sys + " You are a senior strategy consultant. Produce structured, actionable business plans.",
        user: `Create a comprehensive business plan with sections: Executive Summary, Business Idea, Market Analysis, Target Audience, Competitive Analysis, Marketing Strategy, Operations, Financial Plan (rough estimates), Risks, Roadmap.\n\nIdea: ${input.idea}\nIndustry: ${input.industry}\nTarget audience: ${input.target}`,
      };
    case "imprint":
      return {
        sys: sys + " You generate German TMG/DDG-compliant Impressum text.",
        user: `Generate a legally compliant Impressum (German law).\nCompany: ${input.company}\nOwner/Director: ${input.owner}\nAddress: ${input.address}\nEmail: ${input.email}\nPhone: ${input.phone}\n\nInclude all required fields. Add EU-Streitschlichtung reference and OS platform link.`,
      };
    case "privacy":
      return {
        sys: sys + " You generate GDPR-compliant privacy policies.",
        user: `Generate a complete GDPR-compliant privacy policy.\nWebsite: ${input.website}\nController: ${input.company}\nTools used: ${input.tools}\n\nCover: data controller, data collection, cookies, third-party services, user rights (Art. 15-22 GDPR), contact, complaint right.`,
      };
    case "legal":
      return {
        sys: sys + " You provide general legal guidance for business questions. Always include a disclaimer that this is not formal legal advice.",
        user: `Provide a thorough answer to this business legal question:\n\n${input.question}\n\nStructure: Brief Answer, Detailed Explanation, Relevant Laws/Articles, Recommended Next Steps, Disclaimer.`,
      };
    case "contract":
      return {
        sys: sys + " You draft professional contracts.",
        user: `Draft a professional contract.\nType: ${input.contractType}\nParties: ${input.parties}\nKey details: ${input.details}\n\nInclude all standard clauses (parties, subject matter, obligations, term, termination, confidentiality, governing law, signatures).`,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { tool, lang, input, title } = await req.json() as { tool: Tool; lang: string; input: Record<string, string>; title: string };

    const { data: ok, error: cErr } = await supabase.rpc("consume_credit");
    if (cErr) throw cErr;
    if (!ok) {
      return new Response(JSON.stringify({ error: "no_credits" }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { sys, user } = buildPrompt(tool, lang, input);

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI error", resp.status, txt);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "rate_limit" }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "ai_credits" }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    const { data: inserted } = await supabase.from("documents").insert({
      user_id: userData.user.id,
      type: tool,
      title,
      content,
    }).select("id").single();

    return new Response(
      JSON.stringify({ content, documentId: inserted?.id ?? null }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
