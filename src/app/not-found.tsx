import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-6xl">🍺💨</div>
      <h1 className="font-display text-4xl text-medal">Off the table</h1>
      <p className="max-w-xs text-sm text-white/55">
        That page rolled off the map. Let&apos;s get you back to the games.
      </p>
      <Link href="/" className="btn btn-gold">
        Back to Beerlympics
      </Link>
    </div>
  );
}
