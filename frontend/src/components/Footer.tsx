import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/5 py-5 px-8 flex justify-center items-center bg-bg-dark/10 backdrop-blur-sm mt-auto z-10 font-sans">
      <div className="text-[11px] text-[#9CA3AF] tracking-wider font-mono">
        <span className="text-brand-pink font-semibold hover:text-brand-pink hover:drop-shadow-[0_0_6px_#C14F7D] transition-all duration-300 cursor-pointer">
          KAIRON AI v1.0
        </span>
        <span className="text-[#4B5563] px-2">|</span>
        &copy; 2026 Jslxh
      </div>
    </footer>
  );
};

