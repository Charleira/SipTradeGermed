// Item 6 — Cabeçalho Germed Trade (logo oficial + menu por perfil)
import Link from "next/link";
import Image from "next/image";
import { getFuncionarioLogado } from "@/lib/supabase/sipServer";

export async function AppHeader() {
  const eu = await getFuncionarioLogado();
  if (!eu) return null; // não aparece no login

  const admin = eu.time?.toLowerCase() === "trade";
  const gestor = ["GD", "GR", "GN", "DIRETOR"].includes(eu.cargo?.toUpperCase());

  const link = "rounded-md px-2 py-1 text-verde-escuro transition hover:bg-brand-soft hover:text-verde-escuro";

  return (
    <header className="app-header sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="Germed Trade - início">
          <Image src="/germed-trade-logo.png" alt="Germed Trade" width={174} height={40} priority />
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link href="/minhas-sips" className={link}>Minhas SIPs</Link>
          <Link href="/sip/nova" className={link}>Nova SIP</Link>
          {gestor && <Link href="/equipe" className={link}>Minha equipe</Link>}
          {admin && <Link href="/admin" className={link}>Administração</Link>}
          <span className="ml-2 hidden rounded-full bg-verde-escuro px-3 py-1 text-xs font-semibold text-white sm:inline">
            {eu.nome.split(" ")[0]} · {eu.cargo}
          </span>
        </nav>
      </div>
    </header>
  );
}
