import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        className={`${sizes[size]} w-auto text-primary`}
        viewBox="0 0 120 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 8C13.3726 8 8 13.3726 8 20C8 26.6274 13.3726 32 20 32C26.6274 32 32 26.6274 32 20C32 13.3726 26.6274 8 20 8ZM18.5 25V15L24 20L18.5 25Z"
          fill="currentColor"
        />
        <path
          d="M44 14V26H46.5V21.5H49.5C51.7091 21.5 53.5 19.7091 53.5 17.5C53.5 15.2909 51.7091 13.5 49.5 13.5H44V14ZM46.5 19.5V15.5H49.5C50.6046 15.5 51.5 16.3954 51.5 17.5C51.5 18.6046 50.6046 19.5 49.5 19.5H46.5Z"
          fill="currentColor"
        />
        <path
          d="M59.5 26V14H62V24H68.5V26H59.5Z"
          fill="currentColor"
        />
        <path
          d="M74.5 26V14H85V16H77V19H84V21H77V24H85V26H74.5Z"
          fill="currentColor"
        />
        <path
          d="M91 26V14H93.5V24H100V26H91Z"
          fill="currentColor"
        />
      </svg>
      <span className="ml-2 font-semibold text-foreground">
        Rexa
      </span>
    </div>
  );
}