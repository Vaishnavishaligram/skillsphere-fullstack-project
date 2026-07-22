const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-ink-100 rounded-card">
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" className="mb-4 opacity-40">
      <circle cx="8" cy="24" r="3" fill="#0F8A8A" />
      <circle cx="24" cy="8" r="3" stroke="#AEB9CE" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="24" cy="24" r="3" stroke="#AEB9CE" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="8" y1="24" x2="24" y2="8" stroke="#DAD5C9" strokeWidth="1.2" strokeDasharray="3 3" />
      <line x1="8" y1="24" x2="24" y2="24" stroke="#DAD5C9" strokeWidth="1.2" strokeDasharray="3 3" />
    </svg>
    <h3 className="font-display font-semibold text-ink-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-ink-400 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
