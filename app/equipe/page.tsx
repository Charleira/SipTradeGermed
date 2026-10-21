// Item 7 — GD, GR, GN e DIRETOR veem as SIPs da sua região (abaixo do seu cargo)
import { createClient, getFuncionarioLogado } from "@/lib/supabase/sipServer";
import { SipCard } from "@/app/components/sip/SipCard";
import { SIP_SELECT, mapearSip } from "@/lib/sip/mapear";

export default async function SipsDaEquipe() {
  const supabase = await createClient();
  const eu = await getFuncionarioLogado();

  // A regra do banco (pode_ver_sip) já filtra cargo + região
  const { data: sips } = await supabase
    .from("sips")
    .select(SIP_SELECT)
    .neq("solicitante_id", eu?.id ?? "00000000-0000-0000-0000-000000000000")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">SIPs da minha equipe</h1>
        <p className="text-sm text-muted">Região {eu?.regiao ?? "—"} · solicitações da sua equipe.</p>
      </header>

      {sips?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sips.map((s) => <SipCard key={s.id} sip={mapearSip(s)} modo="gestor" />)}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">Nenhuma SIP da equipe por enquanto.</p>
      )}
    </main>
  );
}
