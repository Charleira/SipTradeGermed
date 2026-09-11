import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clientes').select('*')

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="mb-4 text-lg font-semibold">Teste de conexão Supabase</h1>

      {error ? (
        <pre className="rounded bg-red-50 p-4 text-red-700">
          Erro: {error.message}
        </pre>
      ) : (
        <>
          <p className="mb-2 text-green-700">
            ✅ Conexão OK — {data?.length ?? 0} cliente(s) encontrado(s).
          </p>
          <pre className="rounded bg-zinc-100 p-4">
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}