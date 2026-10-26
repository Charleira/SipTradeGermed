"use client";
// Envio de comprovantes de UMA parcela
//  - Mostra os arquivos escolhidos no 📎 (nome, tamanho, botão remover) antes de enviar
//  - Aceita arrastar e soltar
//  - Sobe direto para o Storage (sem limite de 1 MB) e mostra o progresso
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/sipBrowser";
import { registrarComprovantes, type ArquivoEnviado } from "@/app/actions/sip";
import { iconeArquivo, tamanhoLegivel } from "./ListaComprovantes";

const LIMITE_MB = 20;
const ACEITOS = "image/*,.pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx,.msg,.eml";

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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [observacao, setObservacao] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  if (!liberado) return motivo ? <p className="text-xs text-muted">{motivo}</p> : null;

  function adicionar(lista: FileList | null) {
    if (!lista) return;
    setMsg(null);
    const novos: File[] = [];
    const grandes: string[] = [];
    Array.from(lista).forEach((f) => {
      if (f.size > LIMITE_MB * 1024 * 1024) grandes.push(f.name);
      else novos.push(f);
    });
    setArquivos((atual) => {
      const chave = (f: File) => `${f.name}-${f.size}`;
      const existentes = new Set(atual.map(chave));
      return [...atual, ...novos.filter((f) => !existentes.has(chave(f)))];
    });
    if (grandes.length) setMsg({ ok: false, texto: `Acima de ${LIMITE_MB} MB (não adicionados): ${grandes.join(", ")}` });
    if (inputRef.current) inputRef.current.value = ""; // permite escolher o mesmo arquivo de novo
  }

  async function enviar() {
    if (!arquivos.length) return setMsg({ ok: false, texto: "Selecione ao menos um arquivo." });
    setMsg(null);
    const supabase = createBrowserSupabase();
    const enviados: ArquivoEnviado[] = [];

    try {
      for (let i = 0; i < arquivos.length; i++) {
        const f = arquivos[i];
        setEnviando(`Enviando ${i + 1} de ${arquivos.length}: ${f.name}`);
        const nomeSeguro = f.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.\-]/g, "_");
        const path = `${sipId}/${parcelaId}/${Date.now()}_${nomeSeguro}`;
        const { error } = await supabase.storage
          .from("comprovantes")
          .upload(path, f, { contentType: f.type || undefined, upsert: false });
        if (error) throw new Error(`${f.name}: ${error.message}`);
        enviados.push({ path, nome: f.name });
      }

      setEnviando("Registrando comprovantes...");
      const r = await registrarComprovantes(sipId, parcelaId, enviados, observacao);
      if (!r.ok) throw new Error(r.erro);

      setArquivos([]);
      setObservacao("");
      setMsg({ ok: true, texto: `${enviados.length} arquivo(s) enviado(s) com sucesso!` });
      router.refresh();
    } catch (e) {
      // remove o que já tinha subido, para não ficar arquivo solto
      if (enviados.length) await supabase.storage.from("comprovantes").remove(enviados.map((a) => a.path));
      setMsg({ ok: false, texto: e instanceof Error ? e.message : "Erro ao enviar." });
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="space-y-2">
      <label
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionar(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 text-center text-sm transition ${
          arrastando ? "border-brand bg-brand-soft" : "border-border hover:border-brand hover:bg-brand-soft"
        }`}
      >
        <span className="font-medium">📎 Clique ou arraste os arquivos desta parcela</span>
        <span className="text-xs text-muted">Imagens, PDF, PPT, Excel, Word ou e-mail · até {LIMITE_MB} MB cada</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACEITOS}
          className="sr-only"
          onChange={(e) => adicionar(e.target.files)}
          disabled={!!enviando}
        />
      </label>

      {/* Arquivos escolhidos (antes de enviar) */}
      {arquivos.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-background text-sm">
          {arquivos.map((f, i) => (
            <li key={`${f.name}-${f.size}`} className="flex items-center gap-3 px-3 py-2">
              {f.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(f)} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white text-lg">{iconeArquivo(f.name)}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{f.name}</span>
                <span className="text-xs text-muted">{tamanhoLegivel(f.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}
                disabled={!!enviando}
                className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                aria-label={`Remover ${f.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação (opcional)"
          disabled={!!enviando}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!!enviando || !arquivos.length}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {enviando ? "Enviando..." : `Enviar${arquivos.length ? ` (${arquivos.length})` : ""}`}
        </button>
      </div>

      {enviando && <p className="text-xs text-muted">⏳ {enviando}</p>}
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.texto}</p>}
    </div>
  );
}
