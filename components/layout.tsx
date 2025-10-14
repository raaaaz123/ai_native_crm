import React from 'react';

export function Container({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10 ${className}`}>{children}</div>
  );
}

export function Section({ className = "", children, id }: React.PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <section id={id} className={`py-16 sm:py-24 lg:py-32 ${className}`}>{children}</section>
  );
}

export function FeatureCard({
  title,
  description,
  icon,
  className = "",
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-modern group relative p-8 transition-all duration-300 hover-lift animate-fade-in ${className}`}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[--color-primary-50] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[--radius-lg]" />
      
      <div className="relative z-10">
        {icon && (
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[--radius-lg] bg-gradient-to-br from-[--color-primary-50] to-[--color-primary-100] text-[--color-primary] shadow-sm group-hover:shadow-md transition-shadow duration-300">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-[--color-foreground] mb-3 group-hover:text-[--color-primary] transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-[--color-muted] leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-[--radius-lg] ring-1 ring-inset ring-transparent group-hover:ring-[--color-primary]/20 transition-all duration-300" />
    </div>
  );
}

export function Stat({ 
  label, 
  value, 
  trend,
  className = "" 
}: { 
  label: string; 
  value: string; 
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  const trendColors = {
    up: "text-[--color-success]",
    down: "text-[--color-error]",
    neutral: "text-[--color-muted]",
  };
  
  return (
    <div className={`card-modern p-6 text-center group hover-lift ${className}`}>
      <div className="text-xs uppercase tracking-wider text-[--color-muted] mb-2 font-medium">
        {label}
      </div>
      
      <div className="text-3xl font-bold text-[--color-foreground] mb-1 group-hover:text-[--color-primary] transition-colors duration-300">
        {value}
      </div>
      
      {trend && (
        <div className={`text-sm font-medium ${trendColors[trend]}`}>
          {trend === "up" && "↗ Trending up"}
          {trend === "down" && "↘ Trending down"}
          {trend === "neutral" && "→ Stable"}
        </div>
      )}
    </div>
  );
}

export function Testimonial({
  quote,
  author,
  role,
  avatar,
  className = "",
}: {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  className?: string;
}) {
  return (
    <div className={`card-modern p-8 relative overflow-hidden group hover-lift ${className}`}>
      {/* Quote background decoration */}
      <div className="absolute top-4 right-4 text-6xl text-[--color-primary-50] font-serif leading-none select-none">
        "
      </div>
      
      <div className="relative z-10">
        <blockquote className="text-[--color-foreground] text-lg leading-relaxed mb-6 italic">
          "{quote}"
        </blockquote>
        
        <div className="flex items-center gap-4">
          {avatar ? (
            <img 
              src={avatar} 
              alt={author}
              className="w-12 h-12 rounded-full object-cover border-2 border-[--color-border]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[--color-primary-100] to-[--color-primary-200] flex items-center justify-center text-[--color-primary-600] font-semibold text-lg">
              {author.charAt(0)}
            </div>
          )}
          
          <div>
            <div className="font-semibold text-[--color-foreground] group-hover:text-[--color-primary] transition-colors duration-300">
              {author}
            </div>
            <div className="text-sm text-[--color-muted]">
              {role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}