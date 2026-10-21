"use client";
// Itens 1 e 2 — Trade altera status com comentário; travado em Cancelada/Reprovada
import { useState, useTransition } from "react";
import { alterarStatusSip } from "@/app/actions/sip";
import { SIP_STATUS, STATUS_LABEL, statusEditavel, normalizarStatus, type SipStatus } from "@/lib/sip/status";

export function AlterarStatusForm({ sipId, statusAtual: bruto }: { sipId: string; statusAtual: string }) {
  const statusAtual = normalizarStatus(bruto);
  const [status, setStatus] = useState<SipStatus>(statusAtual);
  const [comentario, setComentario] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  if (!statusEditavel(statusAtual)) {
    return (
      <div className="rounded-xl border border-border bg-zinc-50 p-4 text-sm text-muted">
        🔒 Esta SIP está <strong>{STATUS_LABEL[statusAtual]?.toLowerCase()}</strong> e não permite alteração de status.
      </div>
    );
  }

  const salvar = () => {
    if (!statusEditavel(status) && !confirm(`Marcar como "${STATUS_LABEL[status]}" é definitivo. Continuar?`)) return;
    start(async () => {
      const r = await alterarStatusSip(sipId, status, comentario);
      setMsg(r.ok ? { ok: true, texto: "Status atualizado." } : { ok: false, texto: r.erro! });
      if (r.ok) setComentario("");
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <label className="block text-sm font-medium">
        Novo status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SipStatus)}
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {SIP_STATUS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Comentário <span className="font-normal text-muted">(visível para o REP)</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          placeholder="Ex.: Falta a data visível nas fotos de merchandising."
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <button
        onClick={salvar}
        disabled={pending || (status === statusAtual && !comentario.trim())}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar alteração"}
      </button>

      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.texto}</p>}
    </div>
  );
}
