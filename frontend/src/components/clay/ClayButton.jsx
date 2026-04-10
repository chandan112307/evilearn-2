import React from 'react';

export default function ClayButton({ children, onClick, variant = 'default', className = '', ...props }) {
  const baseClass = {
    default: 'clay-btn',
    primary: 'clay-btn-primary',
    cta: 'clay-btn-cta',
  }[variant] || 'clay-btn';

  return (
    <button 
      onClick={onClick} 
      className={`${baseClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
