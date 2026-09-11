import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: funcionario } = await supabase
    .from('funcionarios')
    .select('id, nome, time, regiao')
    .eq('auth_user_id', user.id)
    .single()

  if (!funcionario) {
    return (
      <div className="p-8">
        <p className="text-red-600">
          Seu usuário não está vinculado a um registro de funcionário. Fale com o time responsável.
        </p>
      </div>
    )
  }

  if (funcionario.time === 'trade') {
    redirect('/admin')
  }

  const { data: minhasSips } = await supabase
    .from('sips')
    .select('id, numero, status, cliente_id, created_at')
    .eq('solicitante_id', funcionario.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Olá, {funcionario.nome.split(' ')[0]}</h1>
          <p className="text-sm text-zinc-500">Região: {funcionario.regiao}</p>
        </div>
        <Link
          href="/sip/nova"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          + Nova SIP
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-medium text-zinc-500">Minhas solicitações</h2>

      {!minhasSips || minhasSips.length === 0 ? (
        <p className="text-sm text-zinc-400">Você ainda não abriu nenhuma SIP.</p>
      ) : (
        <div className="divide-y rounded border">
          {minhasSips.map((sip) => (
            <div key={sip.id} className="flex items-center justify-between p-4">
              <span className="font-medium">SIP #{sip.numero}</span>
              <span className="text-sm text-zinc-500">{sip.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}