interface StatTileProps {
  label: string;
  value: string;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 text-center dark:bg-gray-700">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
