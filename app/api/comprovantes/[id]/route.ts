// Abre ou baixa um comprovante.
//  /api/comprovantes/123            -> abre no navegador
//  /api/comprovantes/123?download=1 -> baixa com o nome original
// A consulta passa pelas regras do banco: só quem pode ver a SIP consegue abrir.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/sipServer";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baixar = new URL(req.url).searchParams.has("download");
  const supabase = await createClient();

  const { data: c } = await supabase
    .from("sip_comprovantes")
    .select("arquivo_path, arquivo_nome")
    .eq("id", id)
    .single();

  if (!c) {
    return new NextResponse("Comprovante não encontrado ou você não tem permissão.", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("comprovantes")
    .createSignedUrl(c.arquivo_path, 60, baixar ? { download: c.arquivo_nome } : undefined);

  if (error || !data?.signedUrl) {
    return new NextResponse(`Não foi possível abrir o arquivo: ${error?.message ?? "erro desconhecido"}`, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
