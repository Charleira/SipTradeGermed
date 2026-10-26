// Uma PARCELA (mês) da SIP: status próprio, último comentário,
// comprovantes (com link para abrir), alteração pelo Trade e envio pelo REP.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SipStatusBadge } from "./SipStatusBadge";
import { AlterarStatusForm } from "./AlterarStatusForm";
import { EnviarComprovante } from "./EnviarComprovante";
import { ListaComprovantes, type Comprovante } from "./ListaComprovantes";
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
  comprovantes: Comprovante[];
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
        <p className="mb-1 text-xs font-medium text-muted">Comprovantes ({comprovantes.length})</p>
        <ListaComprovantes itens={comprovantes} />
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
