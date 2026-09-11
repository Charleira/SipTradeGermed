import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NovaSipForm from './NovaSipForm'

export default async function NovaSipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: funcionario } = await supabase
    .from('funcionarios')
    .select('id, nome, regiao, cargo')
    .eq('auth_user_id', user.id)
    .single()

  if (!funcionario) redirect('/')

  const { data: clientesRegiao } = await supabase
    .from('clientes')
    .select('tipo')
    .eq('regiao', funcionario.regiao)

  const tiposCliente = Array.from(new Set((clientesRegiao ?? []).map((c) => c.tipo)))

  return <NovaSipForm funcionario={funcionario} tiposCliente={tiposCliente} />
}