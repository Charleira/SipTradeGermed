"use server";
import { createClient } from "@/lib/supabase/sipServer";
import { revalidatePath } from "next/cache";

function revalidar(sipId?: string) {
  revalidatePath("/admin");
  revalidatePath("/minhas-sips");
  revalidatePath("/equipe");
  if (sipId) revalidatePath(`/sip/${sipId}`);
}

/** Status GERAL da SIP + comentário */
export async function alterarStatusSip(sipId: string, status: string, comentario?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("alterar_status_sip", {
    p_sip_id: sipId,
    p_status: status,
    p_comentario: comentario ?? null,
  });
  if (error) return { ok: false, erro: error.message };
  revalidar(sipId);
  return { ok: true };
}

/** Status de UMA PARCELA + comentário */
export async function alterarStatusParcela(parcelaId: string, status: string, comentario?: string, sipId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("alterar_status_parcela", {
    p_parcela_id: parcelaId,
    p_status: status,
    p_comentario: comentario ?? null,
  });
  if (error) return { ok: false, erro: error.message };
  revalidar(sipId);
  return { ok: true };
}

/** Upload de comprovante de UMA PARCELA */
export async function enviarComprovante(formData: FormData) {
  const supabase = await createClient();
  const sipId = String(formData.get("sipId"));
  const parcelaId = String(formData.get("parcelaId"));
  const observacao = String(formData.get("observacao") ?? "");
  const arquivos = formData.getAll("arquivos") as File[];

  if (!arquivos.length || !arquivos[0].size) return { ok: false, erro: "Selecione ao menos um arquivo." };

  const { data: eu } = await supabase.rpc("meu_funcionario_id");

  for (const arquivo of arquivos) {
    const nomeSeguro = arquivo.name.normalize("NFD").replace(/[^\w.\-]/g, "_");
    const path = `${sipId}/${parcelaId}/${Date.now()}_${nomeSeguro}`;

    const up = await supabase.storage.from("comprovantes").upload(path, arquivo);
    if (up.error) return { ok: false, erro: up.error.message };

    const ins = await supabase.from("sip_comprovantes").insert({
      sip_id: sipId,
      parcela_id: parcelaId,
      arquivo_path: path,
      arquivo_nome: arquivo.name,
      observacao: observacao || null,
      enviado_por: eu,
    });
    if (ins.error) return { ok: false, erro: ins.error.message };
  }

  const { error } = await supabase.rpc("marcar_comprovante_enviado", { p_parcela_id: parcelaId });
  if (error) return { ok: false, erro: error.message };

  revalidar(sipId);
  return { ok: true };
}
