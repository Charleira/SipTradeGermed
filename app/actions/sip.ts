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

export type ArquivoEnviado = { path: string; nome: string };

/** Registra os comprovantes de UMA PARCELA (os arquivos já foram enviados ao Storage pelo navegador) */
export async function registrarComprovantes(
  sipId: string,
  parcelaId: string,
  arquivos: ArquivoEnviado[],
  observacao?: string
) {
  const supabase = await createClient();
  if (!arquivos.length) return { ok: false, erro: "Nenhum arquivo enviado." };

  const { data: eu } = await supabase.rpc("meu_funcionario_id");

  const { error: errIns } = await supabase.from("sip_comprovantes").insert(
    arquivos.map((a) => ({
      sip_id: sipId,
      parcela_id: parcelaId,
      arquivo_path: a.path,
      arquivo_nome: a.nome,
      observacao: observacao?.trim() || null,
      enviado_por: eu,
    }))
  );
  if (errIns) {
    // desfaz os uploads para não deixar arquivo órfão no Storage
    await supabase.storage.from("comprovantes").remove(arquivos.map((a) => a.path));
    return { ok: false, erro: errIns.message };
  }

  const { error } = await supabase.rpc("marcar_comprovante_enviado", { p_parcela_id: parcelaId });
  if (error) return { ok: false, erro: error.message };

  revalidar(sipId);
  return { ok: true };
}
