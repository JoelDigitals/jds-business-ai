import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tools/privacy")({
  head: () => ({ meta: [{ title: "Datenschutz – AurumAI" }] }),
  component: PrivacyTool,
});

function PrivacyTool() {
  const { t } = useI18n();
  return (
    <ToolLayout
      toolKey="privacy"
      title={t("tool.privacy.title")}
      initial={{ website: "", company: "", tools: "" }}
      buildTitle={(i) => `Datenschutz: ${i.website || "Website"}`}
    >
      {(input, set) => (
        <>
          <div><Label>{t("tool.privacy.website")}</Label><Input value={input.website} onChange={(e) => set("website", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.privacy.company")}</Label><Input value={input.company} onChange={(e) => set("company", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.privacy.tools")}</Label><Textarea rows={3} value={input.tools} onChange={(e) => set("tools", e.target.value)} className="mt-1" /></div>
        </>
      )}
    </ToolLayout>
  );
}
