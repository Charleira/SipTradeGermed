import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SipStatusBadge } from '@/app/components/sip/SipStatusBadge'
import { SIP_STATUS, STATUS_LABEL, normalizarStatus } from '@/lib/sip/status'

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filtro } = await searchParams
  const supabase = await createClient()

  const { data: todas } = await supabase
    .from('sips')
    .select(`id, numero, status, regiao, created_at, clientes(nome), funcionarios!solicitante_id(nome, cargo), sip_acoes_mes(id, mes, valor, status)`)
    .order('created_at', { ascending: false })

  const lista = todas ?? []
  const sips = lista.filter((s: any) => !filtro || normalizarStatus(s.status) === filtro)

  const parcelas = lista.flatMap((s: any) => s.sip_acoes_mes ?? [])
  const totalDe = (s: any) => (s.sip_acoes_mes ?? []).reduce((acc: number, m: any) => acc + Number(m.valor), 0)
  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const resumo = [
    { rotulo: 'SIPs', valor: String(lista.length) },
    { rotulo: 'Investimento total', valor: brl(lista.reduce((a: number, s: any) => a + totalDe(s), 0)) },
    { rotulo: 'Parcelas p/ analisar', valor: String(parcelas.filter((p: any) => p.status === 'comprovante_enviado').length) },
    { rotulo: 'Parcelas atrasadas', valor: String(parcelas.filter((p: any) => ['falta_comprovante', 'comprovacao_atrasada'].includes(p.status)).length) },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">Trade Marketing</p>
        <h1 className="text-2xl font-bold">Painel do Trade — Solicitações de Investimento</h1>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {resumo.map((r) => (
          <div key={r.rotulo} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted">{r.rotulo}</p>
            <p className="mt-1 text-xl font-bold text-brand">{r.valor}</p>
          </div>
        ))}
      </div>

      <nav className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
        <Link
          href="/admin"
          className={`rounded-full px-3 py-1.5 ring-1 ring-inset ${!filtro ? 'bg-brand text-white ring-brand' : 'bg-white text-muted ring-border hover:text-brand'}`}
        >
          Todas
        </Link>
        {SIP_STATUS.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`rounded-full px-3 py-1.5 ring-1 ring-inset ${filtro === s ? 'bg-brand text-white ring-brand' : 'bg-white text-muted ring-border hover:text-brand'}`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-soft text-xs uppercase text-brand">
            <tr>
              <th className="px-4 py-3">Nº SIP</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Região</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Parcelas</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sips.map((sip: any) => {
              const ps = [...(sip.sip_acoes_mes ?? [])].sort((a: any, b: any) => +new Date(a.mes) - +new Date(b.mes))
              return (
                <tr key={sip.id} className="transition hover:bg-brand-soft/50">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/sip/${sip.id}`} className="text-brand hover:underline">SIP #{sip.numero}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {sip.funcionarios?.nome}
                    {sip.funcionarios?.cargo && <span className="ml-1 text-xs text-muted">· {sip.funcionarios.cargo}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{sip.regiao}</td>
                  <td className="px-4 py-3">{sip.clientes?.nome}</td>
                  <td className="px-4 py-3">
                    {/* Uma bolinha por parcela, com a cor do status */}
                    <div className="flex flex-wrap gap-1">
                      {ps.map((p: any) => (
                        <span
                          key={p.id}
                          title={`${new Date(p.mes).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })} · ${STATUS_LABEL[p.status ?? 'pendente']}`}
                          className={`h-2.5 w-6 rounded-full ${
                            p.status === 'parcela_paga' ? 'bg-verde-escuro'
                            : p.status === 'parcela_aprovada' ? 'bg-verde-claro'
                            : p.status === 'comprovante_enviado' ? 'bg-azul'
                            : ['falta_comprovante', 'comprovacao_atrasada'].includes(p.status) ? 'bg-laranja'
                            : p.status === 'parcela_recusada' ? 'bg-rose-400'
                            : 'bg-zinc-200'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{brl(totalDe(sip))}</td>
                  <td className="px-4 py-3 text-center"><SipStatusBadge status={sip.status} /></td>
                </tr>
              )
            })}
            {!sips.length && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nenhuma SIP encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
