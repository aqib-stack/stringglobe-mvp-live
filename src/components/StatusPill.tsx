import { JobStatus } from '@/types';

export function StatusPill({ status }: { status: JobStatus }) {
  const cls =
    status === 'RECEIVED'
      ? ''
      : status === 'IN_PROGRESS'
      ? 'yellow'
      : status === 'FINISHED'
      ? 'green'
      : status === 'PAID' || status === 'PICKED_UP'
      ? 'green'
      : '';

  const label = status.replace('_', ' ');
  return <span className={`badge ${cls}`}>{label}</span>;
}
