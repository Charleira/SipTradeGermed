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

export const STATUS_STYLE: Record<SipStatus, string> = {
  aberta: "bg-blue-50 text-blue-700 ring-blue-200",
  em_andamento: "bg-purple-50 text-purple-700 ring-purple-200",
  falta_assinatura: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  aprovada: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  falta_comprovante: "bg-orange-50 text-orange-700 ring-orange-200",
  comprovacao_atrasada: "bg-orange-100 text-orange-800 ring-orange-300",
  parcela_aprovada: "bg-teal-50 text-teal-700 ring-teal-200",
  parcela_recusada: "bg-rose-50 text-rose-700 ring-rose-200",
  parcela_paga: "bg-green-100 text-green-800 ring-green-300",
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
