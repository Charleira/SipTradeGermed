// Item 4 — Caixa com a instrução de comprovação conforme o tipo de ação
import { instrucaoPorTipo } from "@/lib/sip/comprovacao";

export function InstrucaoComprovacao({ tipoAcao }: { tipoAcao: string }) {
  const i = instrucaoPorTipo(tipoAcao);
  return (
    <div className="rounded-xl border-l-4 border-brand bg-brand-soft p-4">
      <p className="text-sm font-semibold text-brand">{i.titulo}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {i.exige.map((e) => <li key={e}>{e}</li>)}
      </ul>
      {i.dica && <p className="mt-2 text-xs text-muted">💡 {i.dica}</p>}
    </div>
  );
}
