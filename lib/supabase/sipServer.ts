// Reaproveita o SEU lib/supabase/server.ts e adiciona o funcionário logado
import { createClient } from "./server";
export { createClient };

export async function getFuncionarioLogado() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("funcionarios")
    .select("id, nome, cargo, regiao, time")
    .eq("auth_user_id", user.id)
    .single();
  return data as { id: string; nome: string; cargo: string; regiao: string; time: string } | null;
}
