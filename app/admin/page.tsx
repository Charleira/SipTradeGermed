import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta', aprovada: 'Aprovada', reprovada: 'Reprovada',
  falta_assinatura: 'Falta Assinatura', em_andamento: 'Em Andamento', comprovacao_atrasada: 'Comprov. Atrasada'
}
const STATUS_STYLES: Record<string, string> = {
  aberta: 'bg-blue-100 text-blue-800', aprovada: 'bg-green-100 text-green-800', reprovada: 'bg-red-100 text-red-800',
  falta_assinatura: 'bg-yellow-100 text-yellow-800', em_andamento: 'bg-purple-100 text-purple-800', comprovacao_atrasada: 'bg-orange-100 text-orange-800'
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: sips } = await supabase
    .from('sips')
    .select(`id, numero, status, regiao, created_at, clientes(nome), funcionarios!solicitante_id(nome), sip_acoes_mes(mes, valor)`)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Painel do Trade — Solicitações de Investimento</h1>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
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
          <tbody className="divide-y">
            {(sips ?? []).map((sip: any) => {
              const total = (sip.sip_acoes_mes ?? []).reduce((acc: number, m: any) => acc + Number(m.valor), 0)
              const meses = (sip.sip_acoes_mes ?? [])
                .map((m: any) => new Date(m.mes).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }))
                .join(', ')
              return (
                <tr key={sip.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/${sip.id}`} className="text-blue-700 hover:underline">SIP #{sip.numero}</Link>
                  </td>
                  <td className="px-4 py-3">{sip.funcionarios?.nome}</td>
                  <td className="px-4 py-3 text-zinc-500">{sip.regiao}</td>
                  <td className="px-4 py-3">{sip.clientes?.nome}</td>
                  <td className="px-4 py-3 text-zinc-500">{meses}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[sip.status]}`}>
                      {STATUS_LABELS[sip.status]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}