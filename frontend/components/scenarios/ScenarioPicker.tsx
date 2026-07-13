"use client";

interface ScenarioPickerProps<T> {
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage: string;
}

export default function ScenarioPicker<T>({
  items,
  getId,
  getLabel,
  selectedId,
  onSelect,
  emptyMessage,
}: ScenarioPickerProps<T>) {
  if (items.length === 0) {
    return <div className="text-sm text-gray-400 italic">{emptyMessage}</div>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const id = getId(item);
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`text-xs px-2 py-1 rounded border ${
              selectedId === id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {getLabel(item)}
          </button>
        );
      })}
    </div>
  );
}
