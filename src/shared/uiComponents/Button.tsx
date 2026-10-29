import { cn } from '@/shared/utils/cn';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
  className?: string;
}

export default function Button({ children, variant = 'primary', size, rightIcon, leftIcon, className, ...props }: ButtonProps) {
  const baseClasses = 'inline-block px-8 py-4 font-medium rounded-xl transition-all shadow-md hover:shadow-xl';

  const variants = {
    primary: 'bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90',
    secondary: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    ghost: 'text-[#4a3728] hover:bg-[#f6ede8]/60 shadow-none',
  };

  return (
    <button className={cn(baseClasses, variants[variant], className)} {...props}>
      {leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
    </button>
  );
}