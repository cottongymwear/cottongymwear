import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link className="wordmark" href={href} aria-label="Cotton Gym Wear — home">
      <span>Cotton</span>
      <span>Gym</span>
      <span>Wear</span>
    </Link>
  );
}
