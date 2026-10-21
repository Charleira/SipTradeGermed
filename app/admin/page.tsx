import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SipStatusBadge } from '@/app/components/sip/SipStatusBadge'
import { SIP_STATUS, STATUS_LABEL, normalizarStatus } from '@/lib/sip/status'

// ALTERADO: labels/cores agora vêm de lib/sip/status.ts (inclui os novos status)
// ALTERADO: link vai para /sip/[id] (detalhe com status + comentário + comprovantes)
// NOVO: filtro por status e cards de resumo

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filtro } = await searchParams
  const supabase = await createClient()

  const { data: todas } = await supabase
    .from('sips')
    .select(`id, numero, status, regiao, created_at, clientes(nome), funcionarios!solicitante_id(nome, cargo), sip_acoes_mes(mes, valor)`)
    .order('created_at', { ascending: false })

  const sips = (todas ?? []).filter((s: any) => !filtro || normalizarStatus(s.status) === filtro)

  const totalDe = (s: any) => (s.sip_acoes_mes ?? []).reduce((acc: number, m: any) => acc + Number(m.valor), 0)
  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const resumo = [
    { rotulo: 'SIPs', valor: String(todas?.length ?? 0) },
    { rotulo: 'Investimento total', valor: brl((todas ?? []).reduce((a: number, s: any) => a + totalDe(s), 0)) },
    { rotulo: 'Aguardando comprovação', valor: String((todas ?? []).filter((s: any) => ['falta_comprovante', 'comprovacao_atrasada'].includes(normalizarStatus(s.status))).length) },
    { rotulo: 'Parcelas pagas', valor: String((todas ?? []).filter((s: any) => normalizarStatus(s.status) === 'parcela_paga').length) },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Trade Marketing</p>
        <h1 className="text-2xl font-bold text-foreground">Painel do Trade — Solicitações de Investimento</h1>
      </header>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {resumo.map((r) => (
          <div key={r.rotulo} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted">{r.rotulo}</p>
            <p className="mt-1 text-xl font-bold text-brand">{r.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtro por status */}
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-soft text-xs uppercase text-brand">
            <tr>
              <th className="px-4 py-3">Nº SIP</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Região</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Meses</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sips.map((sip: any) => {
              const meses = (sip.sip_acoes_mes ?? [])
                .map((m: any) => new Date(m.mes).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }))
                .join(', ')
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
                  <td className="px-4 py-3 text-muted">{meses}</td>
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
