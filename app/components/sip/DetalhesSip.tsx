// Formulário COMPLETO da SIP (somente leitura), sem a área de aprovação do admin.
// Mostra automaticamente todas as colunas de sips, clientes e sip_acoes_mes,
// então campos novos do formulário aparecem sem precisar mexer aqui.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { mesCurto, ordenarParcelas } from "@/lib/sip/mapear";

// Colunas técnicas que não aparecem
const OCULTAR = new Set([
  "id", "sip_id", "solicitante_id", "cliente_id", "auth_user_id", "created_at", "updated_at",
  "status", "status_atualizado_em", "numero", "clientes", "funcionarios", "sip_acoes_mes",
]);

// Rótulos amigáveis (adicione aqui se algum nome ficar estranho)
const ROTULOS: Record<string, string> = {
  regiao: "Região",
  cnpj: "CNPJ",
  razao_social: "Razão social",
  descricao: "Descrição",
  observacao: "Observação",
  observacoes: "Observações",
  mecanica: "Mecânica",
  justificativa: "Justificativa",
  mes: "Mês",
  valor: "Valor",
  tipo_acao: "Tipo de ação",
  distribuidor: "Distribuidor",
};

const rotulo = (k: string) =>
  ROTULOS[k] ?? k.replace(/_id$/, "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function formatar(k: string, v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return Object.values(v).filter(Boolean).join(" · ");
  if (/valor|total|verba|investimento|custo|preco|preço/i.test(k) && !isNaN(Number(v)))
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (k === "mes") return mesCurto(v);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
    return new Date(v).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  return String(v);
}

const campos = (obj: any) => Object.entries(obj ?? {}).filter(([k]) => !OCULTAR.has(k));

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

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-bold uppercase tracking-wide text-brand">{titulo}</h4>
      {children}
    </section>
  );
}

export function DetalhesSip({ sip }: { sip: any }) {
  const parcelas = ordenarParcelas(sip.sip_acoes_mes);
  const colunasParcela = Array.from(
    new Set(parcelas.flatMap((p) => Object.keys(p)).filter((k) => !OCULTAR.has(k)))
  ).sort((a, b) => (a === "mes" ? -1 : b === "mes" ? 1 : 0));

  return (
    <div className="space-y-6">
      <Bloco titulo="Dados da solicitação">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo k="solicitante" v={sip.funcionarios ? `${sip.funcionarios.nome} · ${sip.funcionarios.cargo}` : null} />
          {campos(sip).map(([k, v]) => <Campo key={k} k={k} v={v} />)}
        </div>
      </Bloco>

      {sip.clientes && (
        <Bloco titulo="Cliente">
          <div className="grid gap-3 sm:grid-cols-2">
            {campos(sip.clientes).map(([k, v]) => <Campo key={k} k={k} v={v} />)}
          </div>
        </Bloco>
      )}

      {parcelas.length > 0 && (
        <Bloco titulo="Ações por mês">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-soft text-xs uppercase text-brand">
                <tr>{colunasParcela.map((c) => <th key={c} className="px-3 py-2">{rotulo(c)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parcelas.map((p) => (
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
