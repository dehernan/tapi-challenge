export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-zinc-400 px-1 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
      {children}
    </kbd>
  );
}
