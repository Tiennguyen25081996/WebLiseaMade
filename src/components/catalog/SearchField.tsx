import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";

interface SearchFieldProps {
  value?: string;
  onQueryChange: (value: string) => void;
  className?: string;
}

export function SearchField({ value = "", onQueryChange, className = "" }: SearchFieldProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onQueryChange(localValue);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localValue, value, onQueryChange]);

  const handleClear = () => {
    setLocalValue("");
    onQueryChange("");
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <label htmlFor="search-input" className="sr-only">
        Tìm kiếm sản phẩm
      </label>
      <div className="pointer-events-none absolute left-3.5 flex items-center text-ink-400">
        <SearchIcon className="h-4 w-4" aria-hidden focusable={false} />
      </div>
      <input
        type="search"
        id="search-input"
        name="tim"
        value={localValue}
        placeholder="Tìm kiếm sản phẩm..."
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full bg-sand-50/90 border border-sand-300/80 rounded-full pl-10 pr-9 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900/20 transition-all shadow-2xs"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 text-ink-400 hover:text-ink-700 transition-colors rounded-full"
          aria-label="Xóa từ khóa tìm kiếm"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
