// Uma PARCELA (mês) da SIP: status próprio, último comentário,
// comprovantes (com link para abrir), alteração pelo Trade e envio pelo REP.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SipStatusBadge } from "./SipStatusBadge";
import { AlterarStatusForm } from "./AlterarStatusForm";
import { EnviarComprovante } from "./EnviarComprovante";
import { PARCELA_STATUS, parcelaAceitaComprovante, sipAceitaComprovante, statusEditavel } from "@/lib/sip/status";
import { mesCurto } from "@/lib/sip/mapear";

const brl = (v: number) => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ParcelaCard({
  parcela,
  numero,
  sipId,
  sipStatus,
  comprovantes,
  ultimoComentario,
  souAdmin,
  souSolicitante,
}: {
  parcela: any;
  numero: number;
  sipId: string;
  sipStatus: string;
  comprovantes: { id: number; arquivo_nome: string; url: string | null; created_at: string; observacao?: string | null }[];
  ultimoComentario?: string | null;
  souAdmin: boolean;
  souSolicitante: boolean;
}) {
  const status = parcela.status ?? "pendente";
  const sipTravada = !statusEditavel(sipStatus);

  let motivo: string | undefined;
  if (sipTravada) motivo = "SIP encerrada: envio bloqueado.";
  else if (!sipAceitaComprovante(sipStatus)) motivo = "O envio libera quando a SIP for aprovada.";
  else if (!parcelaAceitaComprovante(status)) motivo = "Parcela em análise ou concluída.";
  const liberado = !motivo;

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Parcela {numero}</p>
          <p className="font-semibold text-brand">
            {mesCurto(parcela.mes)} · {brl(parcela.valor)}
          </p>
        </div>
        <SipStatusBadge status={status} />
      </header>

      {ultimoComentario && (
        <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm">💬 {ultimoComentario}</p>
      )}

      <div className="mt-3">
        <p className="mb-1 text-xs font-medium text-muted">Comprovantes</p>
        {comprovantes.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {comprovantes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="truncate" title={c.observacao ?? ""}>{c.arquivo_nome}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">
                      Abrir
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nenhum comprovante enviado.</p>
        )}
      </div>

      {souSolicitante && (
        <div className="mt-3">
          <EnviarComprovante sipId={sipId} parcelaId={String(parcela.id)} liberado={liberado} motivo={motivo} />
        </div>
      )}

      {souAdmin && (
        <details className="group mt-3 rounded-lg border border-border">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-brand [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">⚙️ Alterar status da parcela</span>
            <span className="hidden group-open:inline">✕ Fechar</span>
          </summary>
          <div className="border-t border-border p-3">
            <AlterarStatusForm
              alvo="parcela"
              id={String(parcela.id)}
              sipId={sipId}
              statusAtual={status}
              opcoes={PARCELA_STATUS}
              bloqueio={sipTravada ? "SIP encerrada: parcelas não podem ser alteradas." : null}
            />
          </div>
        </details>
      )}
    </article>
  );
}
