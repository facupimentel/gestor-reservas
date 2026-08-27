const STYLES = {
  pending: 'bg-brass/15 text-brass border-brass/40',
  confirmed: 'bg-forest/15 text-forest border-forest/40',
  cancelled: 'bg-brick/15 text-brick border-brick/40',
  completed: 'bg-ink/10 text-ink/70 border-ink/30',
};

const LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium font-body ${STYLES[status] || STYLES.pending}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {LABELS[status] || status}
    </span>
  );
}
