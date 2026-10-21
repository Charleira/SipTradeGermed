// Converte a linha do banco (sips + clientes + funcionarios + sip_acoes_mes)
// para o formato do SipCard. Usa o MESMO select do seu app/admin/page.tsx.
import type { SipResumo } from "@/app/components/sip/SipCard";

export const SIP_SELECT =
  "*, clientes(nome), funcionarios!solicitante_id(id, nome, cargo, regiao), sip_acoes_mes(*)";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapearSip(sip: any): SipResumo {
  const acoes: any[] = sip.sip_acoes_mes ?? [];
  const meses = acoes
    .map((m) => new Date(m.mes))
    .filter((d) => !isNaN(+d))
    .sort((a, b) => +a - +b);

  return {
    id: sip.id,
    numero: sip.numero,
    cliente: sip.clientes?.nome ?? "—",
    tipo_acao: sip.tipo_acao ?? acoes[0]?.tipo_acao ?? acoes[0]?.tipo ?? "—",
    valor: acoes.reduce((acc, m) => acc + Number(m.valor ?? 0), 0),
    meses: meses.map((d) => d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })).join(", "),
    status: sip.status,
    created_at: sip.created_at,
    solicitante: sip.funcionarios
      ? { nome: sip.funcionarios.nome, cargo: sip.funcionarios.cargo, regiao: sip.funcionarios.regiao ?? sip.regiao }
      : null,
  };
}
