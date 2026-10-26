// Converte a linha do banco para o formato do SipCard
import type { SipResumo } from "@/app/components/sip/SipCard";

export const SIP_SELECT =
  "*, clientes(nome), funcionarios!solicitante_id(id, nome, cargo, regiao), sip_acoes_mes(*)";

// Detalhe: traz TODOS os campos do cliente e das parcelas
export const SIP_SELECT_COMPLETO =
  "*, clientes(*), funcionarios!solicitante_id(id, nome, cargo, regiao), sip_acoes_mes(*)";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const mesCurto = (mes: string) =>
  new Date(mes).toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });

export const ordenarParcelas = (acoes: any[] = []) =>
  [...acoes].sort((a, b) => +new Date(a.mes) - +new Date(b.mes));

/** Procura o tipo de ação em qualquer coluna com "tipo" no nome */
export function acharTipoAcao(sip: any): string {
  // Coluna real no banco: sips.acao (ex.: "CRM"). Mantém "tipo..." como reserva.
  if (typeof sip?.acao === "string" && sip.acao.trim()) return sip.acao.trim();
  const busca = (o: any) =>
    o && Object.entries(o).find(([k, v]) => /tipo|^acao$/i.test(k) && typeof v === "string" && v.trim())?.[1];
  const acoes = sip.sip_acoes_mes ?? [];
  return (busca(sip) as string) ?? (acoes.map(busca).find(Boolean) as string) ?? "—";
}

export function mapearSip(sip: any): SipResumo {
  const acoes = ordenarParcelas(sip.sip_acoes_mes);
  return {
    id: sip.id,
    numero: sip.numero,
    cliente: sip.clientes?.nome ?? "—",
    tipo_acao: acharTipoAcao(sip),
    valor: acoes.reduce((acc, m) => acc + Number(m.valor ?? 0), 0),
    meses: acoes.map((m) => mesCurto(m.mes)).join(", "),
    status: sip.status,
    created_at: sip.created_at,
    solicitante: sip.funcionarios
      ? { nome: sip.funcionarios.nome, cargo: sip.funcionarios.cargo, regiao: sip.funcionarios.regiao ?? sip.regiao }
      : null,
  };
}
