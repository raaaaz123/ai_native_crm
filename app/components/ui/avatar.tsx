import React from 'react';
import Image from 'next/image';
import { AvatarProps, AVATAR_SIZES } from '../../lib/avatar-utils';

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className = '' 
}: AvatarProps) {
  const sizeClass = AVATAR_SIZES[size];
  
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 relative ${className}`}>
      <Image
        src={src || '/avatars/default.svg'}
        alt={alt}
        fill
        className="object-cover"
        onError={(e) => {
          // Fallback to default avatar if image fails to load
          const target = e.target as HTMLImageElement;
          target.src = '/avatars/default.svg';
        }}
        unoptimized
      />
    </div>
  );
}

export default Avatar;
