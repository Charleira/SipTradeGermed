// Item 6 — Cabeçalho padrão Germed com menu por perfil
import Link from "next/link";
import { getFuncionarioLogado } from "@/lib/supabase/sipServer";

export async function AppHeader() {
  const eu = await getFuncionarioLogado();
  if (!eu) return null; // não mostra no login

  const admin = eu.time?.toLowerCase() === "trade";
  const gestor = ["GD", "GR", "GN", "DIRETOR"].includes(eu.cargo?.toUpperCase());

  return (
    <header className="app-header shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="rounded-md bg-white px-2 py-0.5 text-lg font-extrabold tracking-tight text-brand">Germed</span>
          <span className="text-sm font-semibold text-white/90">SIP Trade</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-white">
          <Link href="/minhas-sips" className="hover:underline">Minhas SIPs</Link>
          <Link href="/sip/nova" className="hover:underline">Nova SIP</Link>
          {gestor && <Link href="/equipe" className="hover:underline">Minha equipe</Link>}
          {admin && <Link href="/admin" className="hover:underline">Administração</Link>}
          <span className="hidden rounded-full bg-white/15 px-3 py-1 text-xs sm:inline">
            {eu.nome.split(" ")[0]} · {eu.cargo}
          </span>
        </nav>
      </div>
    </header>
  );
}
