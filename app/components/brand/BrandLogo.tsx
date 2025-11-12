import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ size = 'md', className = '', showText = true }: BrandLogoProps) {
  const sizes = {
    sm: { logo: 'h-8 w-8', width: 32, height: 32 },
    md: { logo: 'h-10 w-10', width: 40, height: 40 },
    lg: { logo: 'h-12 w-12', width: 48, height: 48 }
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image 
        src="/logo.jpg" 
        alt="Ragzy Logo" 
        width={sizeConfig.width} 
        height={sizeConfig.height}
        className={`${sizeConfig.logo} rounded-md object-contain`}
        priority
      />
      {showText && (
        <span className={`${textSizes[size]} font-semibold text-foreground`}>
          Ragzy
        </span>
      )}
    </div>
  );
}