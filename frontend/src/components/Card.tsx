import type React from 'react';

const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-[rgba(241,242,245,0.9)] shadow-2xl backdrop-blur-md border border-black/5 rounded-2xl p-4">
      {children}
    </div>
  );
};

export default Card;