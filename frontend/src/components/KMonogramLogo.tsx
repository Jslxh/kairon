import React from 'react';

interface LogoProps {
  className?: string;
}

export const KMonogramLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
      <defs>
        {/* Wine Gradient */}
        <linearGradient id="wineGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#720033" />
          <stop offset="50%" stopColor="#A12C5F" />
          <stop offset="100%" stopColor="#C14F7D" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Neural Connection Lines */}
      {/* Stem */}
      <line x1="30" y1="20" x2="30" y2="80" stroke="url(#wineGlow)" strokeWidth="2" opacity="0.6" />
      {/* Upper leg */}
      <line x1="30" y1="50" x2="70" y2="20" stroke="url(#wineGlow)" strokeWidth="2" opacity="0.6" />
      {/* Lower leg */}
      <line x1="30" y1="50" x2="70" y2="80" stroke="url(#wineGlow)" strokeWidth="2" opacity="0.6" />
      {/* Auxiliary/Neural Cross Connections */}
      <line x1="30" y1="20" x2="70" y2="20" stroke="url(#wineGlow)" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.3" />
      <line x1="30" y1="80" x2="70" y2="80" stroke="url(#wineGlow)" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.3" />
      <line x1="70" y1="20" x2="70" y2="80" stroke="url(#wineGlow)" strokeWidth="1" strokeDasharray="3,3" opacity="0.2" />

      {/* Knowledge Graph Nodes (Circles) */}
      {/* Stem Nodes */}
      <circle cx="30" cy="20" r="5" fill="#720033" stroke="#C14F7D" strokeWidth="1.5" filter="url(#glow)" />
      <circle cx="30" cy="50" r="6" fill="#A12C5F" stroke="#FBF7F9" strokeWidth="1.5" filter="url(#glow)" />
      <circle cx="30" cy="80" r="5" fill="#720033" stroke="#C14F7D" strokeWidth="1.5" filter="url(#glow)" />

      {/* Diagonal Branch Nodes */}
      <circle cx="50" cy="35" r="4" fill="#A12C5F" stroke="#C14F7D" strokeWidth="1" />
      <circle cx="70" cy="20" r="6" fill="#C14F7D" stroke="#FBF7F9" strokeWidth="1.5" filter="url(#glow)" />

      <circle cx="50" cy="65" r="4" fill="#A12C5F" stroke="#C14F7D" strokeWidth="1" />
      <circle cx="70" cy="80" r="6" fill="#C14F7D" stroke="#FBF7F9" strokeWidth="1.5" filter="url(#glow)" />
    </svg>
  );
};

