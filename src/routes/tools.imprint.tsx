import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tools/imprint")({
  head: () => ({ meta: [{ title: "Impressum – AurumAI" }] }),
  component: ImprintTool,
});

function ImprintTool() {
  const { t } = useI18n();
  return (
    <ToolLayout
      toolKey="imprint"
      title={t("tool.imprint.title")}
      initial={{ company: "", owner: "", address: "", email: "", phone: "" }}
      buildTitle={(i) => `Impressum: ${i.company || "Firma"}`}
    >
      {(input, set) => (
        <>
          <div><Label>{t("tool.imprint.company")}</Label><Input value={input.company} onChange={(e) => set("company", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.imprint.owner")}</Label><Input value={input.owner} onChange={(e) => set("owner", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.imprint.address")}</Label><Input value={input.address} onChange={(e) => set("address", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.imprint.email")}</Label><Input value={input.email} type="email" onChange={(e) => set("email", e.target.value)} className="mt-1" /></div>
          <div><Label>{t("tool.imprint.phone")}</Label><Input value={input.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1" /></div>
        </>
      )}
    </ToolLayout>
  );
}
