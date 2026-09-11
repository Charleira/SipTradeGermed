// import-funcionarios.js
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import fs from 'fs'
import 'dotenv/config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const workbook = XLSX.read(fs.readFileSync('funcionarios.xlsx'))
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const funcionarios = XLSX.utils.sheet_to_json(sheet)

console.log(`Total de linhas lidas: ${funcionarios.length}`)

// Busca todos os usuários já existentes no Auth (paginado) e monta um mapa email -> id
async function buscarUsuariosExistentes() {
  const mapa = new Map()
  let page = 1

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    for (const u of data.users) {
      mapa.set(u.email, u.id)
    }

    if (data.users.length < 1000) break
    page++
  }

  return mapa
}

const usuariosExistentes = await buscarUsuariosExistentes()
console.log(`Usuários já existentes no Auth: ${usuariosExistentes.size}`)

let sucesso = 0
let falhas = 0

for (const f of funcionarios) {
  const senhaInicial = `${f.codigo}_${f.primeiro_nome}`
  let authUserId = usuariosExistentes.get(f.email)

  if (!authUserId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: f.email,
      password: senhaInicial,
      email_confirm: true,
      user_metadata: { must_change_password: true }
    })

    if (error) {
      console.error(`Erro ao criar ${f.email}:`, error.message)
      falhas++
      continue
    }

    authUserId = data.user.id
  }

  const { error: erroFuncionario } = await supabaseAdmin.from('funcionarios').upsert({
  auth_user_id: authUserId,
  email: f.email,
  nome: f.nome,
  cargo: f.cargo,
  regiao: f.regiao,
  time: String(f.time).trim().toLowerCase()
}, { onConflict: 'email' })

  if (erroFuncionario) {
    console.error(`Erro ao inserir ${f.email} na tabela funcionarios:`, erroFuncionario.message)
    falhas++
  } else {
    sucesso++
  }
}

console.log(`Concluído. Sucesso: ${sucesso}, Falhas: ${falhas}`)