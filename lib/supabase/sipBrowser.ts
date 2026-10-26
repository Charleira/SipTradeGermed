"use client";
// Cliente Supabase do NAVEGADOR — usado só para subir os arquivos direto no Storage.
// Motivo: Server Actions do Next aceitam no máximo 1 MB por envio, então fotos
// maiores falhavam sem aviso. Subindo direto do navegador, o limite é o do bucket.
import { createBrowserClient } from "@supabase/ssr";

export const createBrowserSupabase = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
