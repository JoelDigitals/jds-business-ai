import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tools/contract")({
  head: () => ({ meta: [{ title: "Vertragsgenerator – AurumAI" }] }),
  component: ContractTool,
});

function ContractTool() {
  const { t } = useI18n();
  return (
    <ToolLayout
      toolKey="contract"
      title={t("tool.contract.title")}
      initial={{ contractType: "", parties: "", details: "" }}
      buildTitle={(i) => `Vertrag: ${i.contractType || "Vertrag"}`}
    >
      {(input, set) => (
        <>
          <div><Label>{t("tool.contract.type")}</Label><Input value={input.contractType} onChange={(e) => set("contractType", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.contract.parties")}</Label><Textarea rows={2} value={input.parties} onChange={(e) => set("parties", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.contract.details")}</Label><Textarea rows={4} value={input.details} onChange={(e) => set("details", e.target.value)} className="mt-1" /></div>
        </>
      )}
    </ToolLayout>
  );
}
