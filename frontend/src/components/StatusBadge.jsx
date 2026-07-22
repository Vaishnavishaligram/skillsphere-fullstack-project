const STATUS_STYLES = {
  open: 'badge-open',
  in_progress: 'badge-progress',
  submitted: 'badge-progress',
  completed: 'badge-verified',
  cancelled: 'badge-closed',
  disputed: 'badge-danger',
  draft: 'badge-closed',
  pending: 'badge-progress',
  accepted: 'badge-verified',
  rejected: 'badge-danger',
  withdrawn: 'badge-closed',
  negotiating: 'badge-progress',
  held_in_escrow: 'badge-progress',
  released: 'badge-verified',
  refunded: 'badge-closed',
  failed: 'badge-danger',
};

const StatusBadge = ({ status }) => {
  const className = STATUS_STYLES[status] || 'badge-closed';
  const label = status?.replace(/_/g, ' ');
  return <span className={className}>{label}</span>;
};

export default StatusBadge;
