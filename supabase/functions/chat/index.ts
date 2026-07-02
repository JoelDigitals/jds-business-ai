import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Credit cost heuristics (JDS Business AI)
function computeCost(messages: Msg[]): number {
  const last = messages[messages.length - 1];
  if (!last) return 1;
  const attCount = last.attachments?.length ?? 0;
  const imageCount = last.attachments?.filter((a) => a.type.startsWith("image/")).length ?? 0;
  const textLen = (last.content ?? "").length +
    (last.attachments?.reduce((s, a) => s + (a.text?.length ?? 0), 0) ?? 0);
  let cost = 1;
  if (textLen > 2000) cost += 1;
  if (textLen > 8000) cost += 2;
  cost += imageCount * 2;
  cost += Math.max(0, attCount - imageCount); // +1 per non-image attachment
  return Math.min(cost, 10);
}

interface Attachment {
  name: string;
  type: string; // mime
  dataUrl?: string; // for images: data:image/...;base64,xxxx
  text?: string; // for text/pdf-extracted content
}
interface Msg { role: "user" | "assistant" | "system"; content: string; attachments?: Attachment[]; }

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

    const { conversationId, messages, lang } = await req.json() as { conversationId: string; messages: Msg[]; lang?: string };
    if (!conversationId || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: conv, error: cvErr } = await supabase
      .from("chat_conversations").select("id, user_id").eq("id", conversationId).single();
    if (cvErr || !conv || conv.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const cost = computeCost(messages);
    const { data: ok, error: cErr } = await supabase.rpc("consume_credit", { _amount: cost });
    if (cErr) throw cErr;
    if (!ok) {
      return new Response(JSON.stringify({ error: "no_credits", cost }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const langName = lang === "en" ? "English" : "German (Deutsch)";
    const sys = {
      role: "system" as const,
      content: `You are JDS Business AI, a friendly expert business assistant. Help with strategy, marketing, finance, legal, operations, and any business question. Always respond in ${langName}. Use rich markdown formatting: headings (##, ###), **bold**, *italic*, bullet/numbered lists, tables, and \`code\` blocks where helpful. Structure long answers with clear sections. When giving legal opinions, remind that it is not formal legal advice.`,
    };

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) throw new Error("LOVABLE_API_KEY missing");

    // Build messages with multimodal content for images, inline text for text/pdf
    const apiMessages = messages.map((m) => {
      const atts = m.attachments ?? [];
      if (atts.length === 0) return { role: m.role, content: m.content };

      const parts: any[] = [];
      const textParts: string[] = [];
      if (m.content) textParts.push(m.content);
      for (const a of atts) {
        if (a.type.startsWith("image/") && a.dataUrl) {
          parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
        } else if (a.text) {
          textParts.push(`\n\n--- Anhang: ${a.name} (${a.type}) ---\n${a.text.slice(0, 20000)}\n--- Ende Anhang ---`);
        } else {
          textParts.push(`\n\n[Anhang ohne lesbaren Inhalt: ${a.name} (${a.type})]`);
        }
      }
      const textContent = textParts.join("\n");
      if (parts.length > 0) {
        return { role: m.role, content: [{ type: "text", text: textContent || "(siehe Anhang)" }, ...parts] };
      }
      return { role: m.role, content: textContent };
    });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [sys, ...apiMessages],
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

    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      // Persist user message text + small note about attachments (don't store full base64)
      const attNote = last.attachments?.length
        ? `\n\n_📎 ${last.attachments.length} Anhang/Anhänge: ${last.attachments.map(a => a.name).join(", ")}_`
        : "";
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: userData.user.id,
        role: "user",
        content: (last.content || "") + attNote,
      });
    }
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      user_id: userData.user.id,
      role: "assistant",
      content,
    });
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

    return new Response(JSON.stringify({ content, cost }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
