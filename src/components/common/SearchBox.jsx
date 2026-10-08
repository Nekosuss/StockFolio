import React from "react";
import { Search, X } from "lucide-react";

export function SearchBox({
  query,
  setQuery,
  placeholder = "Search stocks, companies…",
}) {
  return (
    <div className="stock-search">
      <Search size={16} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {query && (
        <button onClick={() => setQuery("")}>
          <X size={15} />
        </button>
      )}
      <kbd>/</kbd>
    </div>
  );
}

export default SearchBox;
