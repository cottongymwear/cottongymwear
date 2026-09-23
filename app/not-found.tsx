import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell page">
      <div className="empty-state">
        <p className="eyebrow">404</p>
        <h1 className="empty-title">Page not found</h1>
        <p className="muted">That link does not match a page in the shop.</p>
        <Link className="btn" href="/shop">
          Go to the shop
        </Link>
      </div>
    </div>
  );
}
