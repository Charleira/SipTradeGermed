// Card ÚNICO (Admin, REP e Gestores).
// Nas listas: "Ver detalhes" leva para /sip/[id].
// Na página da SIP: passe `detalhes` e o botão EXPANDE o formulário completo.
import Link from "next/link";
import { SipStatusBadge } from "./SipStatusBadge";
import { STATUS_LABEL, statusEditavel, normalizarStatus } from "@/lib/sip/status";

export type SipResumo = {
  id: string;
  numero?: string | number | null;
  cliente: string;
  tipo_acao: string;
  valor: number;
  meses: string;
  status: string;
  created_at: string;
  solicitante?: { nome: string; cargo: string; regiao: string } | null;
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function SipCard({
  sip,
  modo,
  detalhes,
}: {
  sip: SipResumo;
  modo: "admin" | "rep" | "gestor";
  detalhes?: React.ReactNode;
}) {
  const status = normalizarStatus(sip.status);
  const travada = !statusEditavel(status);
  const cadeado = travada && <span className="text-xs text-muted">🔒 {STATUS_LABEL[status]}</span>;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm ${
        detalhes ? "" : "transition hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand to-brand-accent" />

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">SIP #{sip.numero ?? sip.id.slice(0, 8)}</p>
          <h3 className="mt-0.5 text-base font-semibold">{sip.cliente}</h3>
        </div>
        <SipStatusBadge status={sip.status} />
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Info rotulo="Tipo de ação" valor={sip.tipo_acao} />
        <Info rotulo="Total" valor={brl(sip.valor)} destaque />
        <Info rotulo="Meses" valor={sip.meses || "—"} />
        <Info rotulo="Criada em" valor={new Date(sip.created_at).toLocaleDateString("pt-BR")} />
        {modo !== "rep" && sip.solicitante && (
          <Info rotulo="Solicitante" valor={`${sip.solicitante.nome} · ${sip.solicitante.cargo} · ${sip.solicitante.regiao}`} full />
        )}
      </dl>

      {detalhes ? (
        <details className="group mt-5 border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-brand [&::-webkit-details-marker]:hidden">
            <span>
              <span className="group-open:hidden">Ver detalhes ↓</span>
              <span className="hidden group-open:inline">Ocultar detalhes ↑</span>
            </span>
            {cadeado}
          </summary>
          <div className="mt-5">{detalhes}</div>
        </details>
      ) : (
        <footer className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
          <Link href={`/sip/${sip.id}`} className="text-sm font-semibold text-brand hover:underline">
            Ver detalhes →
          </Link>
          {cadeado}
        </footer>
      )}
    </article>
  );
}

function Info({ rotulo, valor, destaque, full }: { rotulo: string; valor: string; destaque?: boolean; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs text-muted">{rotulo}</dt>
      <dd className={destaque ? "font-semibold text-brand" : "text-foreground"}>{valor}</dd>
    </div>
  );
}
