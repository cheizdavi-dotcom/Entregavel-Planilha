export const Logo = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="NeonWallet Logo"
  >
    <defs>
      <linearGradient id="neon-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "hsl(151, 100%, 60%)", stopOpacity: 1 }} />
      </linearGradient>
       <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M12 36V12L24 28V12"
      stroke="url(#neon-green-grad)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{filter: "url(#neon-glow)"}}
    />
    <path
      d="M24 36V20L36 36V12"
      stroke="url(#neon-green-grad)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{filter: "url(#neon-glow)"}}
    />
  </svg>
);
