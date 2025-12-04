import React from 'react';

interface PixelLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const PixelLogo: React.FC<PixelLogoProps> = ({ 
  className = "", 
  width = 72,
  height = 72 
}) => {
  return (
    <img 
      src="/ProjectAghoyLogo.png"
      alt="Project Aghoy Logo"
      width={width}
      height={height}
      className={`pixelated-img ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default PixelLogo;