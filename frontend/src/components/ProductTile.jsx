// Small gradient tile showing a product's initials - gives table rows a visual
// identity. The gradient is picked deterministically from the product id so a
// given product always gets the same color.
export default function ProductTile({ product }) {
  const initials = product.name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return <span className={`tile tile--${product.id % 5}`}>{initials}</span>;
}
