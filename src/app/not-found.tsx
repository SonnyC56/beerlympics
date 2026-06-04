import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-white/80">
        <Icon name="beer" size={60} />
      </div>
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
