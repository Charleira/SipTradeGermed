"use server";
import { createClient } from "@/lib/supabase/sipServer";
import { revalidatePath } from "next/cache";

/** Itens 1 e 2 — altera status + grava comentário (trava no banco) */
export async function alterarStatusSip(sipId: string, status: string, comentario?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("alterar_status_sip", {
    p_sip_id: sipId,
    p_status: status,
    p_comentario: comentario ?? null,
  });
  if (error) return { ok: false, erro: error.message };

  revalidatePath("/admin");
  revalidatePath("/minhas-sips");
  revalidatePath("/equipe");
  revalidatePath(`/sip/${sipId}`);
  return { ok: true };
}

/** Item 4 — upload do comprovante (Storage) + registro */
export async function enviarComprovante(formData: FormData) {
  const supabase = await createClient();
  const sipId = String(formData.get("sipId"));
  const observacao = String(formData.get("observacao") ?? "");
  const arquivos = formData.getAll("arquivos") as File[];

  if (!arquivos.length || !arquivos[0].size) return { ok: false, erro: "Selecione ao menos um arquivo." };

  const { data: eu } = await supabase.rpc("meu_funcionario_id");

  for (const arquivo of arquivos) {
    const nomeSeguro = arquivo.name.normalize("NFD").replace(/[^\w.\-]/g, "_");
    const path = `${sipId}/${Date.now()}_${nomeSeguro}`;

    const up = await supabase.storage.from("comprovantes").upload(path, arquivo);
    if (up.error) return { ok: false, erro: up.error.message };

    const ins = await supabase.from("sip_comprovantes").insert({
      sip_id: sipId,
      arquivo_path: path,
      arquivo_nome: arquivo.name,
      observacao: observacao || null,
      enviado_por: eu,
    });
    if (ins.error) return { ok: false, erro: ins.error.message };
  }

  revalidatePath(`/sip/${sipId}`);
  return { ok: true };
}
