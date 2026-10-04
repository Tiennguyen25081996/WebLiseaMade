import { SearchIcon } from "@/components/ui/icons";

interface SearchFieldProps {
  /** Gọi khi người dùng nhập từ khoá; phần còn lại do useCatalogQuery lo. */
  onQueryChange: (value: string) => void;
}

/**
 * Ô tìm kiếm: input `type=search`, mỗi lần người dùng gõ sẽ gọi onChange ->
 * onQueryChange, rồi useCatalogQuery ghi từ khoá lên URL để cập nhật kết quả.
 */
export function SearchField({ onQueryChange }: SearchFieldProps) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-sand-200">
      <div className="flex items-center gap-2">
        <SearchIcon className="h-5 w-5 text-lagoon-700" aria-hidden focusable={false} />
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
          onQueryChange(input.value);
        }}
        className="block w-full rounded-lg px-3 py-2 text-sm text-ink-900 ring-1 ring-sand-300"
      />
    </div>
  );
}
