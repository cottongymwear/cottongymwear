import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty shell">
      <h1>Page not found</h1>
      <p className="lede">That link does not match a page in the shop.</p>
      <p className="cta-row">
        <Link className="btn" href="/shop">
          Go to the shop
        </Link>
      </p>
    </div>
  );
}
