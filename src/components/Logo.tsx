interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* chair */}
      <path d="M14 48 L14 58 M50 48 L50 58" stroke="#16161a" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 58 L54 58" stroke="#16161a" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 40 L12 52 L52 52 L52 40" stroke="#16161a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* android body */}
      <rect x="20" y="26" width="24" height="18" rx="9" fill="#1f9d6b" />
      <rect x="20" y="34" width="24" height="8" fill="#1f9d6b" />
      <circle cx="27" cy="34" r="2.3" fill="#fafaf8" />
      <circle cx="37" cy="34" r="2.3" fill="#fafaf8" />
      <path d="M21 27 A11 11 0 0 1 43 27" fill="#1f9d6b" />
      <line x1="25" y1="18" x2="22" y2="13" stroke="#1f9d6b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="39" y1="18" x2="42" y2="13" stroke="#1f9d6b" strokeWidth="2.5" strokeLinecap="round" />
      {/* little IV drip, because rehab */}
      <line x1="50" y1="10" x2="50" y2="30" stroke="#ff5a1f" strokeWidth="2" strokeLinecap="round" />
      <rect x="46" y="6" width="8" height="10" rx="1.5" stroke="#ff5a1f" strokeWidth="2" fill="none" />
    </svg>
  );
}
