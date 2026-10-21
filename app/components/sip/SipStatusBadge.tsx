import { STATUS_LABEL, STATUS_STYLE, normalizarStatus } from "@/lib/sip/status";

export function SipStatusBadge({ status: bruto }: { status: string }) {
  const status = normalizarStatus(bruto);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLE[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status] ?? bruto}
    </span>
  );
}
