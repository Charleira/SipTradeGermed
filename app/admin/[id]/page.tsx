import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DecisionPanel from './DecisionPanel'

export default async function SipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sip } = await supabase
    .from('sips')
    .select(`*, clientes(nome, tipo), funcionarios!solicitante_id(nome, email, regiao, cargo), sip_cnpjs(cnpj), sip_acoes_mes(mes, valor, descricao), sip_pagamento(*), sip_assinantes(tipo, nome, email)`)
    .eq('id', id)
    .single()

  if (!sip) notFound()

  const total = (sip.sip_acoes_mes ?? []).reduce((acc: number, m: any) => acc + Number(m.valor), 0)

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-2xl font-semibold">SIP #{sip.numero}</h1>
      <p className="mb-6 text-sm text-zinc-500">Aberta em {new Date(sip.created_at).toLocaleDateString('pt-BR')}</p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <span className="text-xs text-zinc-500">Solicitante</span>
          <p className="font-medium">{sip.funcionarios?.nome}</p>
          <p className="text-sm text-zinc-500">{sip.funcionarios?.email}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <span className="text-xs text-zinc-500">Região</span>
          <p className="font-medium">{sip.regiao}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4">
        <span className="text-xs text-zinc-500">Cliente</span>
        <p className="mb-2 font-medium">{sip.clientes?.nome} ({sip.clientes?.tipo})</p>
        <div className="flex flex-wrap gap-2">
          {(sip.sip_cnpjs ?? []).map((c: any) => (
            <span key={c.cnpj} className="rounded bg-zinc-100 px-2 py-1 text-xs font-mono">{c.cnpj}</span>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Ação: {sip.acao}</span>
          <span className="font-semibold text-blue-700">
            Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div className="divide-y">
          {(sip.sip_acoes_mes ?? []).map((m: any) => (
            <div key={m.mes} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium capitalize">{new Date(m.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <p className="text-zinc-500">{m.descricao}</p>
              </div>
              <span className="font-medium">{Number(m.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4">
        <span className="text-xs text-zinc-500">Pagamento</span>
        {sip.sip_pagamento?.tipo === 'deposito' ? (
          <p className="text-sm">Depósito — {sip.sip_pagamento.banco}, Ag {sip.sip_pagamento.agencia}, Conta {sip.sip_pagamento.conta}, CNPJ {sip.sip_pagamento.cnpj_beneficiario}</p>
        ) : (
          <p className="text-sm">Abatimento em duplicata</p>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {(sip.sip_assinantes ?? []).map((a: any) => (
          <div key={a.tipo} className="rounded-lg border bg-white p-4">
            <span className="text-xs text-zinc-500">{a.tipo === 'responsavel' ? 'Responsável' : 'Testemunha'}</span>
            <p className="font-medium">{a.nome}</p>
            <p className="text-sm text-zinc-500">{a.email}</p>
          </div>
        ))}
      </div>

      <DecisionPanel sipId={sip.id} statusAtual={sip.status} />
    </div>
  )
}