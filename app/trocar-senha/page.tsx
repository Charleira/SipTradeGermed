'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function TrocarSenhaPage() {
  const [novaSenha, setNovaSenha] = useState('')
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    const { error: erroSenha } = await supabase.auth.updateUser({ password: novaSenha })
    if (erroSenha) {
      setErro(erroSenha.message)
      return
    }

    await supabase.auth.updateUser({ data: { must_change_password: false } })

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">Defina sua nova senha</h1>
        <p className="mb-6 text-sm text-zinc-500">Este é seu primeiro acesso — por segurança, troque a senha inicial.</p>

        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
          minLength={8}
          placeholder="Nova senha"
          className="mb-4 w-full rounded border px-3 py-2"
        />

        {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

        <button type="submit" className="w-full rounded bg-black py-2 text-white">
          Salvar e continuar
        </button>
      </form>
    </div>
  )
}