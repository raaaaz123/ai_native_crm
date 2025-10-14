import React from 'react';
import { AvatarProps, AVATAR_SIZES } from '../../lib/avatar-utils';

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className = '' 
}: AvatarProps) {
  const sizeClass = AVATAR_SIZES[size];
  
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to default avatar if image fails to load
          const target = e.target as HTMLImageElement;
          target.src = '/avatars/default.svg';
        }}
      />
    </div>
  );
}

export default Avatar;
