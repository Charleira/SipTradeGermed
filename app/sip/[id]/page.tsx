// Itens 1, 2, 3 e 4 — Detalhe ÚNICO da SIP (Admin, REP e Gestores)
//  - Admin (time trade): vê o form de alterar status + comentário
//  - Solicitante (REP): vê a área de envio de comprovação
//  - Gestor da região: só visualiza (com o nome de quem solicitou)
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getFuncionarioLogado } from "@/lib/supabase/sipServer";
import { SipCard, type SipResumo } from "@/app/components/sip/SipCard";
import { HistoricoStatus } from "@/app/components/sip/HistoricoStatus";
import { EnviarComprovante } from "@/app/components/sip/EnviarComprovante";
import { AlterarStatusForm } from "@/app/components/sip/AlterarStatusForm";

export default async function SipDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const eu = await getFuncionarioLogado();

  const { data: sip } = await supabase
    .from("sips")
    .select("*, solicitante:funcionarios!sips_solicitante_id_fkey(id, nome, cargo, regiao)")
    .eq("id", id)
    .single();

  if (!sip) notFound(); // RLS: quem não pode ver cai aqui

  const [{ data: historico }, { data: comprovantes }] = await Promise.all([
    supabase.from("sip_status_historico").select("*").eq("sip_id", id).order("created_at", { ascending: false }),
    supabase.from("sip_comprovantes").select("*").eq("sip_id", id).order("created_at", { ascending: false }),
  ]);

  const souAdmin = eu?.time?.toLowerCase() === "trade";
  const souSolicitante = sip.solicitante_id === eu?.id;
  const modo = souAdmin ? "admin" : souSolicitante ? "rep" : "gestor";

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Link href={souAdmin ? "/admin" : "/minhas-sips"} className="text-sm text-muted hover:text-brand">
          ← Voltar
        </Link>

        <SipCard sip={sip as SipResumo} modo={modo} />

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Histórico e comentários</h2>
          <HistoricoStatus itens={historico ?? []} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Comprovantes enviados</h2>
          {comprovantes?.length ? (
            <ul className="divide-y divide-border text-sm">
              {comprovantes.map((c) => (
                <li key={c.id} className="flex justify-between gap-4 py-2">
                  <span className="truncate">{c.arquivo_nome}</span>
                  <span className="shrink-0 text-muted">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nenhum comprovante enviado.</p>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        {souAdmin && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Alterar status</h2>
            <AlterarStatusForm sipId={sip.id} statusAtual={sip.status} />
          </section>
        )}
        {souSolicitante && (
          <EnviarComprovante sipId={sip.id} tipoAcao={sip.tipo_acao} status={sip.status} />
        )}
      </aside>
    </main>
  );
}
