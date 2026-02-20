/**
 * Responsive Layout Components - stub implementation
 * TODO: implement full responsive layout with breakpoint-aware rendering
 */

import React from 'react';

interface ChildrenProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const ResponsiveContainer: React.FC<ChildrenProps> = ({ children, className = '', ...props }) => (
  <div className={`w-full ${className}`} {...props}>{children}</div>
);

export const ResponsiveCard: React.FC<ChildrenProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`} {...props}>{children}</div>
);

export const ResponsiveText: React.FC<ChildrenProps & { size?: string }> = ({ children, className = '', ...props }) => (
  <p className={`text-base ${className}`} {...props}>{children}</p>
);

export const ResponsiveButton: React.FC<ChildrenProps & { onClick?: () => void; variant?: string; disabled?: boolean }> = ({
  children,
  className = '',
  onClick,
  disabled,
  ...props
}) => (
  <button
    className={`px-4 py-2 rounded font-medium transition-colors ${className}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

export const ResponsiveGrid: React.FC<ChildrenProps & { cols?: number }> = ({ children, className = '', ...props }) => (
  <div className={`grid gap-4 ${className}`} {...props}>{children}</div>
);
