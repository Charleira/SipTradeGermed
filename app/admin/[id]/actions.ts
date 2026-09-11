'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function atualizarStatusSip(sipId: string, novoStatus: string, parecer: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: funcionario } = await supabase
    .from('funcionarios')
    .select('id, time')
    .eq('auth_user_id', user.id)
    .single()

  if (funcionario?.time !== 'trade') throw new Error('Sem permissão para essa ação')

  const { data: sipAtual } = await supabase.from('sips').select('status').eq('id', sipId).single()

  const { error } = await supabase.from('sips').update({ status: novoStatus }).eq('id', sipId)
  if (error) throw error

  await supabase.from('sip_status_history').insert({
    sip_id: sipId,
    status_anterior: sipAtual?.status,
    status_novo: novoStatus,
    alterado_por: funcionario.id,
    observacao: parecer
  })

  // TODO: disparar e-mail de resultado (próximo passo — Edge Function)
  // await supabase.functions.invoke('notificar-resultado-sip', { body: { sipId, novoStatus, parecer } })

  revalidatePath(`/admin/${sipId}`)
  revalidatePath('/admin')
}