import './Button.css';

import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export const Button = ({
  children,
  icon,
  type = 'button',
  className,
  ...props
}: ButtonProps) => {
  return (
    <button type={type} className={clsx('button', className)} {...props}>
      <div className="button-content">
        {icon && <span className="button-icon">{icon}</span>}
        {children}
      </div>
    </button>
  );
};
