import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Msg { role: "user" | "assistant" | "system"; content: string; }

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

    // Verify conversation ownership
    const { data: conv, error: cvErr } = await supabase
      .from("chat_conversations").select("id, user_id").eq("id", conversationId).single();
    if (cvErr || !conv || conv.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: ok, error: cErr } = await supabase.rpc("consume_credit");
    if (cErr) throw cErr;
    if (!ok) {
      return new Response(JSON.stringify({ error: "no_credits" }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const langName = lang === "en" ? "English" : "German (Deutsch)";
    const sys: Msg = {
      role: "system",
      content: `You are JDS Business AI, a friendly expert business assistant. Help with strategy, marketing, finance, legal, operations, and any business question. Always respond in ${langName}. Use markdown formatting where helpful. Be concise but thorough. When giving legal opinions, remind that it is not formal legal advice.`,
    };

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [sys, ...messages.map((m) => ({ role: m.role, content: m.content }))],
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
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: userData.user.id,
        role: "user",
        content: last.content,
      });
    }
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      user_id: userData.user.id,
      role: "assistant",
      content,
    });
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

    return new Response(JSON.stringify({ content }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
