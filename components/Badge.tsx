export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warn" | "bad" | "neutral";
  children: React.ReactNode;
}) {
  const styles =
    tone === "good"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/25"
      : tone === "warn"
      ? "bg-amber-500/15 text-amber-200 border-amber-500/25"
      : tone === "bad"
      ? "bg-rose-500/15 text-rose-200 border-rose-500/25"
      : "bg-white/10 text-white/80 border-white/15";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${styles}`}>
      {children}
    </span>
  );
}
