"use client";
// Item 4 — Espaço de envio da comprovação com instrução por tipo de ação
import { useRef, useState, useTransition } from "react";
import { enviarComprovante } from "@/app/actions/sip";
import { instrucaoPorTipo } from "@/lib/sip/comprovacao";
import { aceitaComprovante, normalizarStatus, type SipStatus } from "@/lib/sip/status";

export function EnviarComprovante({
  sipId,
  tipoAcao,
  status,
}: {
  sipId: string;
  tipoAcao: string;
  status: string;
}) {
  const instrucao = instrucaoPorTipo(tipoAcao);
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  const liberado = aceitaComprovante(normalizarStatus(status));

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Enviar comprovação</h2>

      <div className="mt-3 rounded-xl border-l-4 border-brand bg-brand-soft p-4">
        <p className="text-sm font-semibold text-brand">{instrucao.titulo}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {instrucao.exige.map((e) => <li key={e}>{e}</li>)}
        </ul>
        {instrucao.dica && <p className="mt-2 text-xs text-muted">💡 {instrucao.dica}</p>}
      </div>

      {!liberado ? (
        <p className="mt-4 text-sm text-muted">
          O envio fica disponível quando a SIP estiver aprovada ou com comprovante pendente.
        </p>
      ) : (
        <form
          ref={formRef}
          action={(fd) =>
            start(async () => {
              const r = await enviarComprovante(fd);
              setMsg({ ok: r.ok, texto: r.ok ? "Comprovante enviado com sucesso!" : r.erro! });
              if (r.ok) formRef.current?.reset();
            })
          }
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="sipId" value={sipId} />
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition hover:border-brand hover:bg-brand-soft">
            <span className="text-2xl">📎</span>
            <span className="mt-1 text-sm font-medium">Clique para selecionar os arquivos</span>
            <span className="text-xs text-muted">Imagens, PDF, PPT ou e-mail (.msg/.eml)</span>
            <input
              type="file"
              name="arquivos"
              multiple
              accept="image/*,.pdf,.ppt,.pptx,.msg,.eml,.xlsx"
              className="sr-only"
              required
            />
          </label>
          <textarea
            name="observacao"
            rows={2}
            placeholder="Observação (opcional)"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            disabled={pending}
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {pending ? "Enviando..." : "Enviar comprovação"}
          </button>
          {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.texto}</p>}
        </form>
      )}
    </section>
  );
}
