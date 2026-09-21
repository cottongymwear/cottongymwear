import { Wordmark } from "./Wordmark";

export function Footer({ fulfillment }: { fulfillment: "printful" | "sample" }) {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <Wordmark />
        <p>
          Ships to the United Kingdom and the United States. Printed to order.{" "}
          {fulfillment === "printful"
            ? "Printful is connected for fulfillment."
            : "Sample catalog — connect Printful to fulfill live orders."}
        </p>
      </div>
    </footer>
  );
}
