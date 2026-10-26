// Status da SIP (geral) e da PARCELA (controle de comprovação/pagamento)

/** Status da SIP — o Trade escolhe estes no "Alterar status" geral */
export const SIP_STATUS = [
  "aberta",
  "em_andamento",
  "falta_assinatura",
  "aprovada",
  "reprovada",
  "cancelada",
] as const;

/** Status de cada PARCELA (sip_acoes_mes) */
export const PARCELA_STATUS = [
  "pendente",
  "falta_comprovante",
  "comprovante_enviado",
  "comprovacao_atrasada",
  "parcela_aprovada",
  "parcela_recusada",
  "parcela_paga",
] as const;

export type SipStatus = (typeof SIP_STATUS)[number];
export type ParcelaStatus = (typeof PARCELA_STATUS)[number];

export const STATUS_LABEL: Record<string, string> = {
  // SIP
  aberta: "Aberta",
  em_andamento: "Em andamento",
  falta_assinatura: "Falta assinatura",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
  // Parcela
  pendente: "Pendente",
  falta_comprovante: "Falta comprovante",
  comprovante_enviado: "Comprovante enviado",
  comprovacao_atrasada: "Comprov. atrasada",
  parcela_aprovada: "Parcela aprovada",
  parcela_recusada: "Parcela recusada",
  parcela_paga: "Parcela paga",
};

// Paleta Germed (bg-azul, bg-lilas... vêm do globals.css)
export const STATUS_STYLE: Record<string, string> = {
  aberta: "bg-azul/15 text-[#2f6a88] ring-azul/50",
  em_andamento: "bg-lilas/15 text-[#7d4f78] ring-lilas/50",
  falta_assinatura: "bg-laranja/15 text-[#a5650f] ring-laranja/50",
  aprovada: "bg-verde-claro/20 text-[#3f6e12] ring-verde-claro/60",
  reprovada: "bg-red-100 text-red-800 ring-red-200",
  cancelada: "bg-zinc-100 text-zinc-500 ring-zinc-200",

  pendente: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  falta_comprovante: "bg-laranja/15 text-[#a5650f] ring-laranja/50",
  comprovante_enviado: "bg-azul/15 text-[#2f6a88] ring-azul/50",
  comprovacao_atrasada: "bg-laranja/30 text-[#8a520a] ring-laranja",
  parcela_aprovada: "bg-verde-claro/20 text-[#3f6e12] ring-verde-claro/60",
  parcela_recusada: "bg-rose-50 text-rose-700 ring-rose-200",
  parcela_paga: "bg-verde-escuro text-white ring-verde-escuro",
};

export const normalizarStatus = (s: string): string =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, "_");

/** Item 1: SIP Cancelada ou Reprovada fica travada (inclusive as parcelas) */
export const STATUS_TRAVADOS = ["cancelada", "reprovada"];
export const statusEditavel = (s: string) => !STATUS_TRAVADOS.includes(normalizarStatus(s));

/** SIP precisa estar aprovada/em andamento para receber comprovação */
export const sipAceitaComprovante = (s: string) =>
  ["aprovada", "em_andamento"].includes(normalizarStatus(s));

/** Parcela aceita (re)envio de comprovante nestes status */
export const parcelaAceitaComprovante = (s: string) =>
  ["pendente", "falta_comprovante", "comprovacao_atrasada", "parcela_recusada"].includes(normalizarStatus(s));
