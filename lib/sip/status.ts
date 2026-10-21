// Status da SIP — alinhado ao enum status_sip REAL do banco
export const SIP_STATUS = [
  "aberta",
  "em_andamento",
  "falta_assinatura",
  "aprovada",
  "falta_comprovante",     // novo
  "comprovacao_atrasada",
  "parcela_aprovada",      // novo
  "parcela_recusada",      // novo
  "parcela_paga",          // novo
  "reprovada",
  "cancelada",             // novo
] as const;

export type SipStatus = (typeof SIP_STATUS)[number];

export const STATUS_LABEL: Record<SipStatus, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  falta_assinatura: "Falta assinatura",
  aprovada: "Aprovada",
  falta_comprovante: "Falta comprovante",
  comprovacao_atrasada: "Comprov. atrasada",
  parcela_aprovada: "Parcela aprovada",
  parcela_recusada: "Parcela recusada",
  parcela_paga: "Parcela paga",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
};

// Cores da paleta Germed (bg-azul, bg-lilas... vêm do globals.css)
export const STATUS_STYLE: Record<SipStatus, string> = {
  aberta: "bg-azul/15 text-[#2f6a88] ring-azul/50",
  em_andamento: "bg-lilas/15 text-[#7d4f78] ring-lilas/50",
  falta_assinatura: "bg-laranja/15 text-[#a5650f] ring-laranja/50",
  aprovada: "bg-verde-claro/20 text-[#3f6e12] ring-verde-claro/60",
  falta_comprovante: "bg-laranja/15 text-[#a5650f] ring-laranja/50",
  comprovacao_atrasada: "bg-laranja/30 text-[#8a520a] ring-laranja",
  parcela_aprovada: "bg-azul/15 text-[#2f6a88] ring-azul/50",
  parcela_recusada: "bg-rose-50 text-rose-700 ring-rose-200",
  parcela_paga: "bg-verde-escuro text-white ring-verde-escuro",
  reprovada: "bg-red-100 text-red-800 ring-red-200",
  cancelada: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

/** Item 1: Cancelada e Reprovada ficam travadas (Parcela recusada NÃO trava) */
export const STATUS_TRAVADOS: SipStatus[] = ["cancelada", "reprovada"];
export const statusEditavel = (s: SipStatus) => !STATUS_TRAVADOS.includes(s);

/** Item 4: status em que o REP pode enviar comprovação */
export const aceitaComprovante = (s: SipStatus) =>
  ["aprovada", "em_andamento", "falta_comprovante", "comprovacao_atrasada", "parcela_recusada", "parcela_aprovada"].includes(s);

export const normalizarStatus = (s: string): SipStatus =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, "_") as SipStatus;
