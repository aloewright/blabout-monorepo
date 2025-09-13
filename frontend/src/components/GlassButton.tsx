import type React from 'react';

const GlassButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="bg-[rgba(221,222,223,0.9)] backdrop-blur-md shadow-xl rounded-full px-4 py-2 text-typography font-bold"
    >
      {children}
    </button>
  );
};

export default GlassButton;