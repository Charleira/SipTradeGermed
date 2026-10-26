// Lista de comprovantes com botões "Ver" (abre em nova aba) e "Baixar".
// Os links passam por /api/comprovantes/[id], que confere a permissão e gera
// um link novo na hora — então nunca expira, mesmo com a página aberta há horas.
export type Comprovante = {
  id: number | string;
  arquivo_nome: string;
  created_at: string;
  observacao?: string | null;
};

export function iconeArquivo(nome: string) {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "heic", "bmp"].includes(ext)) return "🖼️";
  if (ext === "pdf") return "📕";
  if (["ppt", "pptx"].includes(ext)) return "📙";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📗";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["msg", "eml"].includes(ext)) return "✉️";
  return "📄";
}

export const tamanhoLegivel = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export function ListaComprovantes({ itens }: { itens: Comprovante[] }) {
  if (!itens.length) return <p className="text-sm text-muted">Nenhum comprovante enviado.</p>;

  const botao = "rounded-md px-2 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-border hover:bg-brand-soft";

  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {itens.map((c) => (
        <li key={c.id} className="flex items-center gap-3 px-3 py-2">
          <span className="text-lg">{iconeArquivo(c.arquivo_nome)}</span>
          <span className="min-w-0 flex-1">
            <a
              href={`/api/comprovantes/${c.id}`}
              target="_blank"
              rel="noreferrer"
              className="block truncate font-medium hover:text-brand hover:underline"
              title="Abrir"
            >
              {c.arquivo_nome}
            </a>
            <span className="text-xs text-muted">
              {new Date(c.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              {c.observacao ? ` · ${c.observacao}` : ""}
            </span>
          </span>
          <span className="flex shrink-0 gap-1">
            <a href={`/api/comprovantes/${c.id}`} target="_blank" rel="noreferrer" className={botao}>Ver</a>
            <a href={`/api/comprovantes/${c.id}?download=1`} className={botao}>Baixar</a>
          </span>
        </li>
      ))}
    </ul>
  );
}
