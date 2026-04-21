import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tools/legal")({
  head: () => ({ meta: [{ title: "Rechtsassistent – AurumAI" }] }),
  component: LegalTool,
});

function LegalTool() {
  const { t } = useI18n();
  return (
    <ToolLayout
      toolKey="legal"
      title={t("tool.legal.title")}
      initial={{ question: "" }}
      buildTitle={(i) => `Rechtsfrage: ${(i.question || "Frage").slice(0, 60)}`}
    >
      {(input, set) => (
        <>
          <div>
            <Label>{t("tool.legal.question")}</Label>
            <Textarea rows={6} value={input.question} onChange={(e) => set("question", e.target.value)} className="mt-1" />
          </div>
          <p className="text-xs text-muted-foreground">{t("tool.legal.disclaimer")}</p>
        </>
      )}
    </ToolLayout>
  );
}
