// Detalhe da SIP
//  - Card com "Ver detalhes" que EXPANDE o formulário completo (sem a área de aprovação)
//  - Parcelas separadas, cada uma com status, comprovantes e comentários próprios
//  - Trade: altera status da SIP (geral) e de cada parcela
//  - REP solicitante: envia comprovante por parcela
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getFuncionarioLogado } from "@/lib/supabase/sipServer";
import { SipCard } from "@/app/components/sip/SipCard";
import { DetalhesSip } from "@/app/components/sip/DetalhesSip";
import { ParcelaCard } from "@/app/components/sip/ParcelaCard";
import { HistoricoStatus, type HistoricoItem } from "@/app/components/sip/HistoricoStatus";
import { AlterarStatusForm } from "@/app/components/sip/AlterarStatusForm";
import { InstrucaoComprovacao } from "@/app/components/sip/InstrucaoComprovacao";
import { SIP_SELECT_COMPLETO, mapearSip, ordenarParcelas, mesCurto } from "@/lib/sip/mapear";
import { SIP_STATUS, STATUS_LABEL, normalizarStatus, statusEditavel } from "@/lib/sip/status";

export default async function SipDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const eu = await getFuncionarioLogado();

  const { data: sip } = await supabase.from("sips").select(SIP_SELECT_COMPLETO).eq("id", id).single();
  if (!sip) notFound(); // quem não tem permissão cai aqui

  const [{ data: histSip }, { data: histParc }, { data: comps }] = await Promise.all([
    supabase.from("sip_status_historico").select("*").eq("sip_id", id),
    supabase.from("sip_parcela_historico").select("*").eq("sip_id", id),
    supabase.from("sip_comprovantes").select("*").eq("sip_id", id).order("created_at", { ascending: false }),
  ]);

  // Links temporários (1h) para abrir os comprovantes
  const comprovantes = await Promise.all(
    (comps ?? []).map(async (c: any) => ({
      ...c,
      url: (await supabase.storage.from("comprovantes").createSignedUrl(c.arquivo_path, 3600)).data?.signedUrl ?? null,
    }))
  );

  const parcelas = ordenarParcelas(sip.sip_acoes_mes);
  const nomeParcela = (pid: string) => {
    const i = parcelas.findIndex((p: any) => String(p.id) === String(pid));
    return i >= 0 ? `Parcela ${i + 1} · ${mesCurto(parcelas[i].mes)}` : "Parcela";
  };

  // Histórico unificado (SIP + parcelas), mais recente primeiro
  const historico: HistoricoItem[] = [
    ...(histSip ?? []).map((h: any) => ({ id: `s${h.id}`, rotulo: null, status_novo: h.status_novo, comentario: h.comentario, created_at: h.created_at })),
    ...(histParc ?? []).map((h: any) => ({ id: `p${h.id}`, rotulo: nomeParcela(h.parcela_id), status_novo: h.status_novo, comentario: h.comentario, created_at: h.created_at })),
  ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  const ultimoComentario = (pid: string) =>
    (histParc ?? [])
      .filter((h: any) => String(h.parcela_id) === String(pid) && h.comentario)
      .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))[0]?.comentario ?? null;

  const resumo = mapearSip(sip);
  const souAdmin = eu?.time?.toLowerCase() === "trade";
  const souSolicitante = sip.solicitante_id === eu?.id;
  const modo = souAdmin ? "admin" : souSolicitante ? "rep" : "gestor";
  const sipStatus = normalizarStatus(sip.status);

  const pagas = parcelas.filter((p: any) => p.status === "parcela_paga").length;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Link href={souAdmin ? "/admin" : "/minhas-sips"} className="text-sm text-muted hover:text-brand">← Voltar</Link>

        <SipCard sip={resumo} modo={modo} detalhes={<DetalhesSip sip={sip} />} />

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Parcelas</h2>
            <span className="text-xs text-muted">{pagas} de {parcelas.length} pagas</span>
          </div>
          {parcelas.length ? (
            <div className="space-y-4">
              {parcelas.map((p: any, i: number) => (
                <ParcelaCard
                  key={p.id}
                  parcela={p}
                  numero={i + 1}
                  sipId={sip.id}
                  sipStatus={sipStatus}
                  comprovantes={comprovantes.filter((c: any) => String(c.parcela_id) === String(p.id))}
                  ultimoComentario={ultimoComentario(p.id)}
                  souAdmin={souAdmin}
                  souSolicitante={souSolicitante}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Esta SIP não tem parcelas cadastradas.</p>
          )}

          {/* Comprovantes antigos (enviados antes do controle por parcela) */}
          {comprovantes.some((c: any) => !c.parcela_id) && (
            <div className="mt-4 text-sm">
              <p className="mb-1 text-xs font-medium text-muted">Comprovantes gerais (sem parcela)</p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {comprovantes.filter((c: any) => !c.parcela_id).map((c: any) => (
                  <li key={c.id} className="flex justify-between gap-3 px-3 py-2">
                    <span className="truncate">{c.arquivo_nome}</span>
                    {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand hover:underline">Abrir</a>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Histórico e comentários</h2>
          <HistoricoStatus itens={historico} />
        </section>
      </div>

      <aside className="space-y-6">
        {souAdmin && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Status da SIP</h2>
            <AlterarStatusForm
              alvo="sip"
              id={sip.id}
              sipId={sip.id}
              statusAtual={sipStatus}
              opcoes={SIP_STATUS}
              bloqueio={
                statusEditavel(sipStatus)
                  ? null
                  : `Esta SIP está ${STATUS_LABEL[sipStatus]?.toLowerCase()} e não permite alteração de status.`
              }
            />
            <p className="mt-3 text-xs text-muted">Comprovação e pagamento são controlados em cada parcela.</p>
          </section>
        )}

        {(souSolicitante || souAdmin) && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Como comprovar</h2>
            <InstrucaoComprovacao tipoAcao={resumo.tipo_acao} />
            {souSolicitante && (
              <p className="mt-3 text-xs text-muted">Envie os arquivos dentro de cada parcela, ao lado.</p>
            )}
          </section>
        )}
      </aside>
    </main>
  );
}
