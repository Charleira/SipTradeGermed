'use client'

import { useState, useTransition } from 'react'
import { atualizarStatusSip } from './actions'

const OUTROS_STATUS = [
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'falta_assinatura', label: 'Falta Assinatura' },
  { value: 'comprovacao_atrasada', label: 'Comprovação Atrasada' }
]

export default function DecisionPanel({ sipId, statusAtual }: { sipId: string; statusAtual: string }) {
  const [parecer, setParecer] = useState('')
  const [outroStatus, setOutroStatus] = useState(OUTROS_STATUS[0].value)
  const [isPending, startTransition] = useTransition()
  const [mensagem, setMensagem] = useState('')

  function decidir(status: string) {
    if (!parecer.trim()) {
      setMensagem('Escreva um parecer antes de decidir.')
      return
    }
    setMensagem('')
    startTransition(async () => {
      try {
        await atualizarStatusSip(sipId, status, parecer)
        setMensagem('Status atualizado com sucesso.')
      } catch (e: any) {
        setMensagem(`Erro: ${e.message}`)
      }
    })
  }

  return (
    <div className="rounded-xl border bg-zinc-50 p-5">
      <h2 className="mb-3 font-semibold">Parecer & decisão do Trade</h2>
      <p className="mb-2 text-xs text-zinc-500">Status atual: <span className="font-medium">{statusAtual}</span></p>

      <textarea
        value={parecer}
        onChange={(e) => setParecer(e.target.value)}
        placeholder="Justificativa / parecer do trade..."
        rows={3}
        className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
      />

      {mensagem && <p className="mb-3 text-sm text-red-600">{mensagem}</p>}

      <div className="flex flex-col gap-2">
        <button disabled={isPending} onClick={() => decidir('aprovada')} className="w-full rounded-lg bg-green-600 py-2 font-medium text-white disabled:opacity-50">
          Aprovar SIP
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={isPending} onClick={() => decidir('reprovada')} className="rounded-lg bg-red-100 py-2 font-medium text-red-700 disabled:opacity-50">
            Reprovar SIP
          </button>
          <div className="flex gap-1">
            <select value={outroStatus} onChange={(e) => setOutroStatus(e.target.value)} className="flex-1 rounded-lg border px-2 text-sm">
              {OUTROS_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button disabled={isPending} onClick={() => decidir(outroStatus)} className="rounded-lg bg-zinc-200 px-3 text-sm font-medium disabled:opacity-50">
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}