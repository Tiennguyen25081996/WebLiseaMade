import { useState } from "react";
import { SearchIcon } from "@/components/ui/icons";

interface SearchFieldProps {
  onQueryChange: (value: string) => void;
}

export function SearchField({ onQueryChange }: SearchFieldProps) {
  const [lastValue, setLastValue] = useState("");

  return (
    <div className="rounded-hair border-1 border-sand-200 bg-sand-100 px-4 py-4">
      <div className="flex items-center gap-2">
        <SearchIcon className="h-5 w-5 text-ink-700" aria-hidden focusable={false} />
        <label htmlFor="tim-kiem" className="text-sm font-semibold text-ink-700">
          Tìm kiếm:
        </label>
      </div>
      <input
        type="search"
        id="tim-kiem"
        name="tim"
        onChange={(event) => {
          const input = event.target as HTMLInputElement;
          if (input.value !== lastValue) {
            setLastValue(input.value);
            onQueryChange(input.value);
          }
        }}
        className="block w-full rounded-hair px-3 py-2 text-sm text-ink-900 border-1 border-sand-300 focus:border-ink-900/50"
      />
    </div>
  );
}
