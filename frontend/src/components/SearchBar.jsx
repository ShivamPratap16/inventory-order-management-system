import { IconSearch, IconClose } from "./Icons.jsx";

export default function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="search">
      <IconSearch className="search__icon" width={18} height={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search__clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <IconClose width={15} height={15} />
        </button>
      )}
    </div>
  );
}
