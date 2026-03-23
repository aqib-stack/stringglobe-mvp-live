export function getRacquetHealth(lastStringDate?: string | null) {
  if (!lastStringDate) return { label: 'Fresh', tone: 'green' as const };
  const diffMs = Date.now() - new Date(lastStringDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days >= 60) return { label: 'Red', tone: 'red' as const };
  if (days >= 30) return { label: 'Yellow', tone: 'yellow' as const };
  return { label: 'Fresh', tone: 'green' as const };
}
