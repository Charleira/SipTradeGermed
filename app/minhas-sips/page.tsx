// Item 3 — REP vê as próprias SIPs no mesmo card do Admin
import Link from "next/link";
import { createClient, getFuncionarioLogado } from "@/lib/supabase/sipServer";
import { SipCard, type SipResumo } from "@/app/components/sip/SipCard";

export default async function MinhasSips() {
  const supabase = await createClient();
  const eu = await getFuncionarioLogado();

  const { data: sips } = await supabase
    .from("sips")
    .select("*")
    .eq("solicitante_id", eu?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Minhas SIPs</h1>
          <p className="text-sm text-muted">Acompanhe status, comentários e envie comprovações.</p>
        </div>
        <Link href="/sip/nova" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          + Nova SIP
        </Link>
      </header>

      {sips?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sips.map((s) => <SipCard key={s.id} sip={s as SipResumo} modo="rep" />)}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Você ainda não tem SIPs.
        </p>
      )}
    </main>
  );
}
