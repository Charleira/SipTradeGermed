"use client";
// Upload de comprovante de UMA parcela
import { useRef, useState, useTransition } from "react";
import { enviarComprovante } from "@/app/actions/sip";

export function EnviarComprovante({
  sipId,
  parcelaId,
  liberado,
  motivo,
}: {
  sipId: string;
  parcelaId: string;
  liberado: boolean;
  motivo?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  if (!liberado) return motivo ? <p className="text-xs text-muted">{motivo}</p> : null;

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          const r = await enviarComprovante(fd);
          setMsg({ ok: r.ok, texto: r.ok ? "Comprovante enviado!" : r.erro! });
          if (r.ok) formRef.current?.reset();
        })
      }
      className="space-y-2"
    >
      <input type="hidden" name="sipId" value={sipId} />
      <input type="hidden" name="parcelaId" value={parcelaId} />
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-4 text-sm transition hover:border-brand hover:bg-brand-soft">
        <span>📎</span>
        <span className="font-medium">Selecionar arquivos desta parcela</span>
        <input type="file" name="arquivos" multiple required accept="image/*,.pdf,.ppt,.pptx,.msg,.eml,.xlsx" className="sr-only" />
      </label>
      <div className="flex gap-2">
        <input
          name="observacao"
          placeholder="Observação (opcional)"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
          {pending ? "Enviando..." : "Enviar"}
        </button>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.texto}</p>}
    </form>
  );
}
