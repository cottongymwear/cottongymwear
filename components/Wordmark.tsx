import Link from "next/link";

export function Wordmark({ href = "/", onClick }: { href?: string; onClick?: () => void }) {
  return (
    <Link className="wordmark" href={href} aria-label="Cotton Gym Wear, home" onClick={onClick}>
      <span>Cotton</span>
      <i aria-hidden="true">·</i>
      <span>Gym</span>
      <i aria-hidden="true">·</i>
      <span>Wear</span>
    </Link>
  );
}
