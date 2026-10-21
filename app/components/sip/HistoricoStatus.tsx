// Item 2 — Linha do tempo com os comentários do Trade (visível ao REP)
import { SipStatusBadge } from "./SipStatusBadge";

export type HistoricoItem = {
  id: number;
  status_novo: string;
  comentario: string | null;
  created_at: string;
};

export function HistoricoStatus({ itens }: { itens: HistoricoItem[] }) {
  if (!itens.length) return <p className="text-sm text-muted">Nenhuma movimentação ainda.</p>;

  return (
    <ol className="relative space-y-5 border-l-2 border-border pl-6">
      {itens.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand shadow" />
          <div className="flex flex-wrap items-center gap-2">
            <SipStatusBadge status={h.status_novo} />
            <time className="text-xs text-muted">
              {new Date(h.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </time>
          </div>
          {h.comentario && <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2 text-sm">💬 {h.comentario}</p>}
        </li>
      ))}
    </ol>
  );
}
