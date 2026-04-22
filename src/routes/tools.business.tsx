import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tools/business")({
  head: () => ({ meta: [{ title: "Businessplan – AurumAI" }] }),
  component: BusinessTool,
});

function BusinessTool() {
  const { t } = useI18n();
  return (
    <ToolLayout
      toolKey="business"
      title={t("tool.business.title")}
      initial={{ idea: "", industry: "", target: "" }}
      buildTitle={(i) => `Businessplan: ${i.idea?.slice(0, 60) || "Untitled"}`}
      legal={false}
    >
      {(input, set) => (
        <>
          <div>
            <Label>{t("tool.business.idea")}</Label>
            <Textarea rows={4} value={input.idea} onChange={(e) => set("idea", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>{t("tool.business.industry")}</Label>
            <Input value={input.industry} onChange={(e) => set("industry", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>{t("tool.business.target")}</Label>
            <Input value={input.target} onChange={(e) => set("target", e.target.value)} className="mt-1" />
          </div>
        </>
      )}
    </ToolLayout>
  );
}
