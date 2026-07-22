const Logo = ({ size = 'md', showWordmark = true }) => {
  const dims = { sm: 20, md: 26, lg: 34 }[size];

  return (
    <div className="flex items-center gap-2.5">
      <svg width={dims} height={dims} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="8" cy="24" r="3.5" fill="#0F8A8A" />
        <circle cx="24" cy="8" r="3.5" fill="#FFB100" />
        <circle cx="24" cy="24" r="3.5" fill="#10192E" />
        <line x1="8" y1="24" x2="24" y2="8" stroke="#AEB9CE" strokeWidth="1.5" />
        <line x1="8" y1="24" x2="24" y2="24" stroke="#AEB9CE" strokeWidth="1.5" />
        <line x1="24" y1="8" x2="24" y2="24" stroke="#AEB9CE" strokeWidth="1.5" />
      </svg>
      {showWordmark && (
        <span className="font-display font-semibold text-lg tracking-tight text-ink-900">
          SkillSphere
        </span>
      )}
    </div>
  );
};

export default Logo;
