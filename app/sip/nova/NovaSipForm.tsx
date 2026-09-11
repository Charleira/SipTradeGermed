'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Funcionario = { id: string; nome: string; regiao: string; cargo: string }
type Cliente = { id: string; nome: string }
type Cnpj = { id: string; cnpj: string }

const OPCOES_ACAO = ['CRM', 'MERCHANDISING', 'TRADE CAMPANHA', 'E-COMMERCE', 'EVENTOS']

function proximosMeses(qtd = 6) {
  const hoje = new Date()
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const valor = d.toISOString().slice(0, 10) // YYYY-MM-01
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { valor, label }
  })
}

export default function NovaSipForm({ funcionario, tiposCliente }: { funcionario: Funcionario; tiposCliente: string[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [tipoCliente, setTipoCliente] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [cnpjs, setCnpjs] = useState<Cnpj[]>([])
  const [cnpjsRemovidos, setCnpjsRemovidos] = useState<Set<string>>(new Set())

  const [acao, setAcao] = useState('')
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>([])
  const [mesesDados, setMesesDados] = useState<Record<string, { valor: string; descricao: string }>>({})

  const [formaPagamento, setFormaPagamento] = useState<'deposito' | 'abatimento'>('deposito')
  const [banco, setBanco] = useState('')
  const [agencia, setAgencia] = useState('')
  const [conta, setConta] = useState('')
  const [cnpjBeneficiario, setCnpjBeneficiario] = useState('')

  const [respNome, setRespNome] = useState('')
  const [respEmail, setRespEmail] = useState('')
  const [testNome, setTestNome] = useState('')
  const [testEmail, setTestEmail] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const meses = proximosMeses()
  const total = mesesSelecionados.reduce((acc, m) => acc + (Number(mesesDados[m]?.valor) || 0), 0)
  const cnpjsAtivos = cnpjs.filter((c) => !cnpjsRemovidos.has(c.id))
  const opcoesAcaoDisponiveis = OPCOES_ACAO.filter((op) => op !== 'TRADE CAMPANHA' || tipoCliente === 'DISTY')

  async function onTipoChange(tipo: string) {
    setTipoCliente(tipo)
    setClienteId('')
    setCnpjs([])
    if (acao === 'TRADE CAMPANHA' && tipo !== 'DISTY') {
      setAcao('')
    }
    const { data } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('regiao', funcionario.regiao)
      .eq('tipo', tipo)
      .order('nome')
    setClientes(data ?? [])
  }

  async function onClienteChange(id: string) {
    setClienteId(id)
    setCnpjsRemovidos(new Set())
    const cliente = clientes.find((c) => c.id === id)
    setClienteNome(cliente?.nome ?? '')
    const { data } = await supabase.from('cliente_cnpjs').select('id, cnpj').eq('cliente_id', id)
    setCnpjs(data ?? [])
  }

  function toggleMes(mes: string) {
    setMesesSelecionados((prev) => {
      if (prev.includes(mes)) {
        const novo = { ...mesesDados }
        delete novo[mes]
        setMesesDados(novo)
        return prev.filter((m) => m !== mes)
      }
      setMesesDados((d) => ({ ...d, [mes]: { valor: '', descricao: '' } }))
      return [...prev, mes]
    })
  }

  function atualizarMes(mes: string, campo: 'valor' | 'descricao', valor: string) {
    setMesesDados((d) => ({ ...d, [mes]: { ...d[mes], [campo]: valor } }))
  }

  function validar(): string | null {
    if (!clienteId) return 'Selecione um cliente.'
    if (cnpjsAtivos.length === 0) return 'Ao menos um CNPJ precisa participar.'
    if (!acao) return 'Selecione a ação a ser feita no cliente.'
    if (mesesSelecionados.length === 0) return 'Selecione ao menos um mês.'
    for (const m of mesesSelecionados) {
      if (!mesesDados[m]?.valor || !mesesDados[m]?.descricao) return 'Preencha valor e descrição de todos os meses selecionados.'
    }
    if (formaPagamento === 'deposito' && (!banco || !agencia || !conta || !cnpjBeneficiario)) {
      return 'Preencha os dados bancários completos.'
    }
    if (!respNome || !respEmail || !testNome || !testEmail) return 'Preencha os dados dos dois assinantes.'
    return null
  }

  function abrirConfirmacao() {
    const msg = validar()
    if (msg) {
      setErro(msg)
      return
    }
    setErro('')
    setShowModal(true)
  }

  async function confirmarEnvio() {
    setEnviando(true)
    setErro('')

    const { data: sip, error: erroSip } = await supabase
      .from('sips')
      .insert({
        solicitante_id: funcionario.id,
        regiao: funcionario.regiao,
        cliente_id: clienteId,
        acao,
        status: 'aberta'
      })
      .select()
      .single()

    if (erroSip || !sip) {
      setErro(erroSip?.message ?? 'Erro ao criar SIP.')
      setEnviando(false)
      return
    }

    await supabase.from('sip_cnpjs').insert(cnpjsAtivos.map((c) => ({ sip_id: sip.id, cnpj: c.cnpj })))

    await supabase.from('sip_acoes_mes').insert(
      mesesSelecionados.map((m) => ({
        sip_id: sip.id,
        mes: m,
        valor: Number(mesesDados[m].valor),
        descricao: mesesDados[m].descricao
      }))
    )

    await supabase.from('sip_pagamento').insert({
      sip_id: sip.id,
      tipo: formaPagamento,
      banco: formaPagamento === 'deposito' ? banco : null,
      agencia: formaPagamento === 'deposito' ? agencia : null,
      conta: formaPagamento === 'deposito' ? conta : null,
      cnpj_beneficiario: formaPagamento === 'deposito' ? cnpjBeneficiario : null
    })

    await supabase.from('sip_assinantes').insert([
      { sip_id: sip.id, tipo: 'responsavel', nome: respNome, email: respEmail },
      { sip_id: sip.id, tipo: 'testemunha', nome: testNome, email: testEmail }
    ])

    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-semibold">Nova SIP — Solicitação de Investimento</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {funcionario.nome} • {funcionario.cargo} • Região {funcionario.regiao}
      </p>

      {/* 1. Cliente & CNPJs */}
      <section className="mb-5 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-800">1. Cliente & CNPJs participantes</h2>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de cliente</label>
            <select
              value={tipoCliente}
              onChange={(e) => onTipoChange(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {tiposCliente.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => onClienteChange(e.target.value)}
              disabled={!tipoCliente}
              className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-zinc-50"
            >
              <option value="">Selecione...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {clienteId && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">CNPJs de {clienteNome}</span>
              <span className="text-xs font-semibold text-blue-700">
                {cnpjsAtivos.length} de {cnpjs.length} participando
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cnpjs.map((c) => {
                const removido = cnpjsRemovidos.has(c.id)
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${removido ? 'opacity-50' : 'bg-zinc-50'}`}
                  >
                    <span className="font-mono">{c.cnpj}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCnpjsRemovidos((prev) => {
                          const novo = new Set(prev)
                          removido ? novo.delete(c.id) : novo.add(c.id)
                          return novo
                        })
                      }
                      className={removido ? 'text-blue-700' : 'text-red-600'}
                    >
                      {removido ? 'Readicionar' : 'Remover'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* 2. Ação & Meses */}
      <section className="mb-5 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-800">2. Ação & cronograma de investimento</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Ação a ser feita no cliente</label>
          <select
            value={acao}
            onChange={(e) => setAcao(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {opcoesAcaoDisponiveis.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Meses de vigência</label>
          <div className="flex flex-wrap gap-2">
            {meses.map((m) => (
              <label
                key={m.valor}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm capitalize ${
                  mesesSelecionados.includes(m.valor) ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700' : 'bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-1.5"
                  checked={mesesSelecionados.includes(m.valor)}
                  onChange={() => toggleMes(m.valor)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        {mesesSelecionados.map((m) => {
          const label = meses.find((x) => x.valor === m)?.label
          return (
            <div key={m} className="mb-3 rounded-lg bg-zinc-50 p-4">
              <p className="mb-2 text-sm font-semibold capitalize text-zinc-700">{label}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Valor (R$)</label>
                  <input
                    type="number"
                    value={mesesDados[m]?.valor ?? ''}
                    onChange={(e) => atualizarMes(m, 'valor', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-zinc-500">Descrição da ação no mês</label>
                  <input
                    value={mesesDados[m]?.descricao ?? ''}
                    onChange={(e) => atualizarMes(m, 'descricao', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )
        })}

        {mesesSelecionados.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
            <span className="text-sm font-medium text-blue-900">Investimento total</span>
            <span className="font-semibold text-blue-900">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        )}
      </section>

      {/* 3. Pagamento */}
      <section className="mb-5 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-800">3. Forma de pagamento</h2>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(['deposito', 'abatimento'] as const).map((tipo) => (
            <label
              key={tipo}
              className={`cursor-pointer rounded-lg border p-3 text-sm ${
                formaPagamento === tipo ? 'border-blue-600 bg-blue-50' : ''
              }`}
            >
              <input
                type="radio"
                name="formaPagamento"
                className="mr-2"
                checked={formaPagamento === tipo}
                onChange={() => setFormaPagamento(tipo)}
              />
              {tipo === 'deposito' ? 'Depósito em conta' : 'Abatimento em duplicata'}
            </label>
          ))}
        </div>

        {formaPagamento === 'deposito' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="Banco" value={banco} onChange={(e) => setBanco(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Agência" value={agencia} onChange={(e) => setAgencia(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Conta" value={conta} onChange={(e) => setConta(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="CNPJ beneficiário" value={cnpjBeneficiario} onChange={(e) => setCnpjBeneficiario(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
        )}
      </section>

      {/* 4. Assinantes */}
      <section className="mb-5 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-800">4. Assinantes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-600">Responsável</p>
            <input placeholder="Nome" value={respNome} onChange={(e) => setRespNome(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="E-mail" type="email" value={respEmail} onChange={(e) => setRespEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-600">Testemunha</p>
            <input placeholder="Nome" value={testNome} onChange={(e) => setTestNome(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="E-mail" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <button onClick={abrirConfirmacao} className="w-full rounded-lg bg-black py-3 font-medium text-white">
        Enviar SIP para aprovação do Trade
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-2 text-lg font-semibold">Confirmar envio?</h3>
            <p className="mb-4 text-sm text-zinc-600">
              Cliente: <strong>{clienteNome}</strong> · Total: <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600">
                Revisar
              </button>
              <button
                onClick={confirmarEnvio}
                disabled={enviando}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}