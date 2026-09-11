import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import fs from 'fs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Ajuste aqui os nomes exatos das colunas da sua planilha
const COLUNAS = {
  nome: 'nome',
  tipo: 'tipo',
  regiao: 'regiao',
  cnpj: 'cnpj'
}

const workbook = XLSX.read(fs.readFileSync('clientes.xlsx'))
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const linhas = XLSX.utils.sheet_to_json(sheet)

console.log('Total de linhas lidas:', linhas.length)
console.log('Exemplo da primeira linha:', JSON.stringify(linhas[0], null, 2))

// Agrupa as linhas por cliente (nome + tipo + regiao), já que o cliente se repete por CNPJ
const clientesMap = new Map()

for (const linha of linhas) {
  const nome = linha[COLUNAS.nome]
  const tipo = linha[COLUNAS.tipo]
  const regiao = linha[COLUNAS.regiao]
  const cnpj = linha[COLUNAS.cnpj]

  const chave = `${nome}|${tipo}|${regiao}`

  if (!clientesMap.has(chave)) {
    clientesMap.set(chave, { nome, tipo, regiao, cnpjs: [] })
  }
  clientesMap.get(chave).cnpjs.push(cnpj)
}

console.log('Total de clientes únicos:', clientesMap.size)

for (const cliente of clientesMap.values()) {
  const { data: clienteInserido, error: erroCliente } = await supabaseAdmin
    .from('clientes')
    .insert({ nome: cliente.nome, tipo: cliente.tipo, regiao: cliente.regiao })
    .select()
    .single()

  if (erroCliente) {
    console.error(`Erro ao criar cliente ${cliente.nome}:`, erroCliente.message)
    continue
  }

  const cnpjsParaInserir = cliente.cnpjs.map((cnpj) => ({
    cliente_id: clienteInserido.id,
    cnpj
  }))

  const { error: erroCnpjs } = await supabaseAdmin
    .from('cliente_cnpjs')
    .insert(cnpjsParaInserir)

  if (erroCnpjs) {
    console.error(`Erro ao criar CNPJs de ${cliente.nome}:`, erroCnpjs.message)
  }
}

console.log('Importação concluída.')