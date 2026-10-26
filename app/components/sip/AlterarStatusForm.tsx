"use client";
// Alterar status com comentário — serve para a SIP (geral) e para cada PARCELA
import { useState, useTransition } from "react";
import { alterarStatusSip, alterarStatusParcela } from "@/app/actions/sip";
import { STATUS_LABEL, normalizarStatus } from "@/lib/sip/status";

export function AlterarStatusForm({
  alvo,
  id,
  sipId,
  statusAtual: bruto,
  opcoes,
  bloqueio,
}: {
  alvo: "sip" | "parcela";
  id: string;
  sipId: string;
  statusAtual: string;
  opcoes: readonly string[];
  bloqueio?: string | null; // texto do aviso 🔒 (quando não pode alterar)
}) {
  const statusAtual = normalizarStatus(bruto);
  const [status, setStatus] = useState(statusAtual);
  const [comentario, setComentario] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  if (bloqueio) {
    return <div className="rounded-xl border border-border bg-background p-3 text-sm text-muted">🔒 {bloqueio}</div>;
  }

  const definitivo = alvo === "sip" && ["cancelada", "reprovada"].includes(status);

  const salvar = () => {
    if (definitivo && !confirm(`Marcar a SIP como "${STATUS_LABEL[status]}" é definitivo. Continuar?`)) return;
    start(async () => {
      const r =
        alvo === "sip"
          ? await alterarStatusSip(id, status, comentario)
          : await alterarStatusParcela(id, status, comentario, sipId);
      setMsg(r.ok ? { ok: true, texto: "Status atualizado." } : { ok: false, texto: r.erro! });
      if (r.ok) setComentario("");
    });
  };

  const campo = "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        Novo status
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={campo}>
          {opcoes.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Comentário <span className="font-normal text-muted">(visível para o REP)</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={alvo === "sip" ? 3 : 2}
          placeholder={alvo === "sip" ? "Ex.: Aprovada conforme verba do trimestre." : "Ex.: Foto sem data visível, reenviar."}
          className={campo}
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
