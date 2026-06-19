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
