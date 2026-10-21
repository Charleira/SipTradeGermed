// Item 4 — Instruções de comprovação por tipo de ação
// Base: diretriz "SIP Trade Germed - 2026". A busca é por palavra-chave,
// então funciona com "Trade MKT - Campanha de Vendas", "Merchandising" etc.

export type InstrucaoComprovacao = { titulo: string; exige: string[]; dica?: string };

const REGRAS: { chaves: string[]; instrucao: InstrucaoComprovacao }[] = [
  {
    chaves: ["crm", "sms", "whatsapp", "e-mail", "email", "push", "cupom"],
    instrucao: {
      titulo: "CRM (SMS, WhatsApp, e-mail marketing, push, cupom)",
      exige: ["Prints dos envios com data e horário visíveis na imagem"],
      dica: "Cupom de oferta no PDV: foto com o nome Germed em destaque na ativação.",
    },
  },
  {
    chaves: ["midia", "mídia", "online", "influencer", "instagram", "landing", "e-commerce"],
    instrucao: {
      titulo: "Mídia online (e-commerce, influencers, Instagram, landing page)",
      exige: ["Prints dos envios/publicações com data visível ou fotos da ação"],
    },
  },
  {
    chaves: ["merchandising", "display", "gondola", "gôndola", "vitrine", "cestao", "cestão", "checkout"],
    instrucao: {
      titulo: "Merchandising (display, cestão, ponta de gôndola, vitrine etc.)",
      exige: ["Fotos com boa visibilidade dos itens e do local na loja", "CNPJ ou nome do PDV", "Data da comprovação"],
      dica: "Prateleiras preenchidas e bom ângulo. Foto sem data é recusada.",
    },
  },
  {
    chaves: ["campanha", "vendas", "televendas", "vendedor"],
    instrucao: {
      titulo: "Campanha de vendas (televendas / vendedor)",
      exige: ["Inventário de vendas", "E-mail do cliente comprovando o envio"],
      dica: "Lembre de enviar as metas da campanha previamente.",
    },
  },
  {
    chaves: ["treinamento", "ead", "presencial"],
    instrucao: { titulo: "Treinamento (EAD ou presencial)", exige: ["Relatório de presença, fotos, prints ou PPT do treinamento"] },
  },
  {
    chaves: ["balconista", "balcão", "balcao"],
    instrucao: {
      titulo: "Ação com balconista",
      exige: ["Informações de fonte de apuração auditável e homologada"],
      dica: "Somente produtos autorizados pelas equipes Jurídica e de Riscos.",
    },
  },
  {
    chaves: ["evento", "feira"],
    instrucao: {
      titulo: "Eventos da rede / feiras",
      exige: ["Fotos do evento", "NF com o valor pago (quando houver)", "Termo de participação, PPT ou e-mail de formalização"],
    },
  },
];

export function instrucaoPorTipo(tipo?: string | null): InstrucaoComprovacao {
  const t = (tipo ?? "").toLowerCase();
  return (
    REGRAS.find((r) => r.chaves.some((c) => t.includes(c)))?.instrucao ?? {
      titulo: "Comprovação da ação",
      exige: ["Envie as evidências da execução conforme a diretriz SIP Trade"],
    }
  );
}
