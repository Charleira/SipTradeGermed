// Item 3 — Card ÚNICO reutilizado por Admin, REP e Gestores.
// O que muda entre os perfis é só o "modo" (ações disponíveis).
import Link from "next/link";
import { SipStatusBadge } from "./SipStatusBadge";
import { STATUS_LABEL, statusEditavel, normalizarStatus, type SipStatus } from "@/lib/sip/status";

export type SipResumo = {
  id: string;
  numero?: string | null;
  cliente: string;
  tipo_acao: string;
  valor: number;
  periodo_inicio?: string | null;
  periodo_fim?: string | null;
  status: SipStatus;
  created_at: string;
  solicitante?: { nome: string; cargo: string; regiao: string } | null;
};

type Modo = "admin" | "rep" | "gestor";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

export function SipCard({
  sip,
  modo,
  acoes,
}: {
  sip: SipResumo;
  modo: Modo;
  acoes?: React.ReactNode; // ex.: botão "Alterar status" no admin
}) {
  const status = normalizarStatus(sip.status);
  const travada = !statusEditavel(status);
  const href = `/sip/${sip.id}`;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        travada ? "opacity-70" : ""
      }`}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand to-brand-accent" />

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            SIP {sip.numero ?? sip.id.slice(0, 8)}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-foreground">{sip.cliente}</h3>
        </div>
        <SipStatusBadge status={sip.status} />
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Info rotulo="Tipo de ação" valor={sip.tipo_acao} />
        <Info rotulo="Valor" valor={brl(sip.valor)} destaque />
        <Info rotulo="Período" valor={`${data(sip.periodo_inicio)} a ${data(sip.periodo_fim)}`} />
        <Info rotulo="Criada em" valor={data(sip.created_at)} />
        {/* Item 7 — gestores e admin veem quem solicitou */}
        {modo !== "rep" && sip.solicitante && (
          <Info
            rotulo="Solicitante"
            valor={`${sip.solicitante.nome} · ${sip.solicitante.cargo} · ${sip.solicitante.regiao}`}
            full
          />
        )}
      </dl>

      <footer className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
        <Link href={href} className="text-sm font-semibold text-brand hover:underline">
          Ver detalhes →
        </Link>
        {travada ? (
          <span className="text-xs text-muted">SIP {STATUS_LABEL[status]?.toLowerCase()}: sem alterações</span>
        ) : (
          acoes
        )}
      </footer>
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
