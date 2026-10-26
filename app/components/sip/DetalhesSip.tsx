// Formulário COMPLETO da SIP (somente leitura), sem a área de aprovação do admin.
//  - Dados da solicitação e do cliente (todas as colunas, automático)
//  - CNPJs do cliente
//  - Responsáveis do cliente + e-mails para assinatura do contrato
//  - Ações por mês
// CNPJs e responsáveis são encontrados onde estiverem: colunas da SIP/cliente
// (texto, lista ou JSON) ou tabelas ligadas (via função sip_dados_relacionados).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { mesCurto, ordenarParcelas } from "@/lib/sip/mapear";

type Linha = Record<string, any>;

// Colunas técnicas que não aparecem
const OCULTAR = new Set([
  "id", "sip_id", "solicitante_id", "cliente_id", "auth_user_id", "created_at", "updated_at",
  "status", "status_atualizado_em", "numero", "clientes", "funcionarios", "sip_acoes_mes", "cliente",
]);
const tecnica = (k: string) => OCULTAR.has(k) || /_id$/.test(k);

const RE_CNPJ = /cnpj/i;
const RE_EMAIL = /e-?mail/i;
const RE_RESP = /respons|contato|assinat|signat|representante/i;
const RE_NOME = /^nome|nome$|^name/i;

// Rótulos amigáveis (adicione aqui se algum nome ficar estranho)
const ROTULOS: Record<string, string> = {
  regiao: "Região",
  cnpj: "CNPJ",
  razao_social: "Razão social",
  descricao: "Descrição",
  observacao: "Observação",
  observacoes: "Observações",
  mecanica: "Mecânica",
  mes: "Mês",
  uf: "UF",
  email: "E-mail",
  telefone: "Telefone",
  tipo_acao: "Tipo de ação",
  acao: "Tipo de ação",
};
const rotulo = (k: string) =>
  ROTULOS[k] ?? k.replace(/_id$/, "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// ---------- formatação ----------
export function formatarCnpj(v: any) {
  const d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return String(v ?? "—");
}

function formatar(k: string, v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (RE_CNPJ.test(k) && typeof v !== "object") return formatarCnpj(v);
  if (Array.isArray(v))
    return v.map((x) => (x && typeof x === "object" ? Object.values(x).filter(Boolean).join(" · ") : String(x))).join(", ");
  if (typeof v === "object") return Object.values(v).filter(Boolean).join(" · ");
  if (/valor|total|verba|investimento|custo|preco|preço/i.test(k) && !isNaN(Number(v)))
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (k === "mes") return mesCurto(v);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
    return new Date(v).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  return String(v);
}

// Converte texto JSON / lista / texto separado por vírgula em linhas
function lerJson(v: any) {
  if (typeof v === "string" && /^\s*[\[{]/.test(v)) {
    try { return JSON.parse(v); } catch { /* segue como texto */ }
  }
  return v;
}
function paraLinhas(v: any, chave: string): Linha[] {
  v = lerJson(v);
  if (v === null || v === undefined || v === "") return [];
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => (typeof x === "object" ? x : { [chave]: x }));
  if (typeof v === "object") return [v];
  if (chave === "cnpj") return String(v).split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean).map((s) => ({ cnpj: s }));
  return [{ [chave]: v }];
}
const temChave = (o: Linha, re: RegExp) => o && typeof o === "object" && Object.keys(o).some((k) => re.test(k));
const juntarCliente = (l: Linha) => (l.cliente ? { ...l, ...l.cliente, cliente: undefined } : l);

// ---------- coleta ----------
function coletar(sip: any, relacionados: Record<string, Linha[]> | null) {
  const cnpjs: Linha[] = [];
  const responsaveis: Linha[] = [];
  const camposResp: [string, any][] = [];
  const usadas = { sip: new Set<string>(), cliente: new Set<string>() };
  const outros: [string, Linha[]][] = [];

  // 1) Colunas da própria SIP e do cliente
  (["sip", "cliente"] as const).forEach((origem) => {
    const obj = origem === "sip" ? sip : sip.clientes;
    if (!obj) return;
    Object.entries(obj).forEach(([k, bruto]) => {
      if (tecnica(k)) return;
      const v = lerJson(bruto);
      const listaComEmail = Array.isArray(v) && v.some((x) => temChave(x, RE_EMAIL));
      const listaComCnpj = Array.isArray(v) && v.some((x) => temChave(x, RE_CNPJ));

      if (RE_CNPJ.test(k) || listaComCnpj) {
        const linhas = paraLinhas(v, "cnpj");
        // CNPJ principal do cliente: leva o nome/razão social junto
        if (origem === "cliente" && linhas.length === 1 && !temChave(linhas[0], RE_NOME))
          linhas[0] = { ...linhas[0], razao_social: obj.razao_social ?? obj.nome };
        cnpjs.push(...linhas);
        usadas[origem].add(k);
      } else if (RE_RESP.test(k) || RE_EMAIL.test(k) || listaComEmail) {
        if (v && typeof v === "object") responsaveis.push(...paraLinhas(v, "nome"));
        else camposResp.push([k, v]);
        usadas[origem].add(k);
      }
    });
  });

  // 2) Tabelas ligadas à SIP ou ao cliente
  Object.entries(relacionados ?? {}).forEach(([tabela, linhas]) => {
    const ls = (linhas ?? []).map(juntarCliente);
    if (RE_RESP.test(tabela) || ls.some((l) => temChave(l, RE_EMAIL))) responsaveis.push(...ls);
    else if (RE_CNPJ.test(tabela) || ls.some((l) => temChave(l, RE_CNPJ))) cnpjs.push(...ls);
    else outros.push([tabela, ls]);
  });

  // remove CNPJs repetidos
  const vistos = new Set<string>();
  const cnpjsUnicos = cnpjs.filter((l) => {
    const k = Object.keys(l).find((c) => RE_CNPJ.test(c));
    const d = String(k ? l[k] : JSON.stringify(l)).replace(/\D/g, "");
    if (vistos.has(d)) return false;
    vistos.add(d);
    return true;
  });

  return { cnpjs: cnpjsUnicos, responsaveis, camposResp, usadas, outros };
}

// ---------- peças visuais ----------
function Campo({ k, v }: { k: string; v: any }) {
  const longo = typeof v === "string" && v.length > 60;
  return (
    <div className={longo ? "sm:col-span-2" : ""}>
      <p className="mb-1 text-xs font-medium text-muted">{rotulo(k)}</p>
      <div className="min-h-[38px] whitespace-pre-wrap rounded-lg border border-border bg-background px-3 py-2 text-sm">
        {formatar(k, v)}
      </div>
    </div>
  );
}

function Bloco({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold uppercase tracking-wide text-brand">{titulo}</h4>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Tabela({ linhas, primeira }: { linhas: Linha[]; primeira?: RegExp }) {
  let cols = Array.from(new Set(linhas.flatMap((l) => Object.keys(l)))).filter((k) => !tecnica(k));
  if (primeira) cols = [...cols.filter((c) => primeira.test(c)), ...cols.filter((c) => !primeira.test(c))];
  cols = cols.slice(0, 7);
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-soft text-xs uppercase text-brand">
          <tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2">{rotulo(c)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {linhas.map((l, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c} className={`px-3 py-2 ${RE_CNPJ.test(c) ? "whitespace-nowrap font-mono" : ""}`}>
                  {formatar(c, l[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CartaoResponsavel({ r, n }: { r: Linha; n: number }) {
  const kNome = Object.keys(r).find((k) => RE_NOME.test(k));
  const kEmail = Object.keys(r).find((k) => RE_EMAIL.test(k));
  const resto = Object.entries(r).filter(([k, v]) => k !== kNome && k !== kEmail && !tecnica(k) && v !== null && v !== "");
  const email = kEmail ? String(r[kEmail]) : null;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Responsável {n}</p>
      <p className="mt-0.5 font-semibold">{kNome ? r[kNome] : "—"}</p>
      {email ? (
        <a href={`mailto:${email}`} className="mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-brand hover:underline">
          ✉️ {email}
        </a>
      ) : (
        <p className="mt-1 text-sm text-muted">Sem e-mail cadastrado</p>
      )}
      {resto.length > 0 && (
        <dl className="mt-2 space-y-0.5 text-xs text-muted">
          {resto.map(([k, v]) => (
            <div key={k}><span className="font-medium">{rotulo(k)}:</span> {formatar(k, v)}</div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ---------- componente principal ----------
export function DetalhesSip({ sip, relacionados }: { sip: any; relacionados?: Record<string, Linha[]> | null }) {
  const parcelas = ordenarParcelas(sip.sip_acoes_mes);
  const { cnpjs, responsaveis, camposResp, usadas, outros } = coletar(sip, relacionados ?? null);

  const camposSip = Object.entries(sip).filter(([k]) => !tecnica(k) && !usadas.sip.has(k));
  const camposCliente = Object.entries(sip.clientes ?? {}).filter(([k]) => !tecnica(k) && !usadas.cliente.has(k));

  const emails = responsaveis
    .map((r) => { const k = Object.keys(r).find((c) => RE_EMAIL.test(c)); return k ? String(r[k]) : null; })
    .concat(camposResp.filter(([k]) => RE_EMAIL.test(k)).map(([, v]) => String(v ?? "")))
    .filter((e): e is string => !!e && e.includes("@"));

  const colunasParcela = Array.from(new Set(parcelas.flatMap((p: Linha) => Object.keys(p))))
    .filter((k) => !tecnica(k))
    .sort((a, b) => (a === "mes" ? -1 : b === "mes" ? 1 : 0));

  return (
    <div className="space-y-7">
      <Bloco titulo="Dados da solicitação">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo k="solicitante" v={sip.funcionarios ? `${sip.funcionarios.nome} · ${sip.funcionarios.cargo}` : null} />
          {camposSip.map(([k, v]) => <Campo key={k} k={k} v={v} />)}
        </div>
      </Bloco>

      {sip.clientes && (
        <Bloco titulo="Cliente">
          <div className="grid gap-3 sm:grid-cols-2">
            {camposCliente.map(([k, v]) => <Campo key={k} k={k} v={v} />)}
          </div>
        </Bloco>
      )}

      <Bloco
        titulo={`CNPJs do cliente${cnpjs.length ? ` (${cnpjs.length})` : ""}`}
      >
        {cnpjs.length ? (
          <Tabela linhas={cnpjs} primeira={RE_CNPJ} />
        ) : (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted">Nenhum CNPJ informado nesta SIP.</p>
        )}
      </Bloco>

      <Bloco
        titulo="Responsáveis do cliente · assinatura do contrato"
        extra={
          emails.length > 0 && (
            <a
              href={`mailto:${emails.join(";")}`}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              ✉️ E-mail para todos ({emails.length})
            </a>
          )
        }
      >
        {responsaveis.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {responsaveis.map((r, i) => <CartaoResponsavel key={i} r={r} n={i + 1} />)}
          </div>
        )}
        {camposResp.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {camposResp.map(([k, v]) => <Campo key={k} k={k} v={v} />)}
          </div>
        )}
        {!responsaveis.length && !camposResp.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted">Nenhum responsável informado nesta SIP.</p>
        )}
      </Bloco>

      {outros.map(([tabela, linhas]) => (
        <Bloco key={tabela} titulo={rotulo(tabela)}>
          <Tabela linhas={linhas} />
        </Bloco>
      ))}

      {parcelas.length > 0 && (
        <Bloco titulo="Ações por mês">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-soft text-xs uppercase text-brand">
                <tr>{colunasParcela.map((c) => <th key={c} className="px-3 py-2">{rotulo(c)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parcelas.map((p: Linha) => (
                  <tr key={p.id}>
                    {colunasParcela.map((c) => <td key={c} className="px-3 py-2">{formatar(c, p[c])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloco>
      )}
    </div>
  );
}
