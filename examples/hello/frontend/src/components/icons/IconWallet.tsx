import clsx from 'clsx';
import type { SVGProps } from 'react';

import { useTheme } from '../../hooks/useTheme';

const IconWallet = ({
  size = 24,
  className,
  ...otherProps
}: SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
}) => {
  const { theme } = useTheme();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(
        {
          'text-primary-light': theme === 'light',
          'text-primary-dark': theme === 'dark',
        },
        className
      )}
      {...otherProps}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.75 12C14.75 11.5858 15.0858 11.25 15.5 11.25H19V12.75H15.5C15.0858 12.75 14.75 12.4142 14.75 12Z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 6.5H4.5V17.5H20C20.2761 17.5 20.5 17.2761 20.5 17V7C20.5 6.72386 20.2761 6.5 20 6.5ZM3 5V19H20C21.1046 19 22 18.1046 22 17V7C22 5.89543 21.1046 5 20 5H3Z"
      />
    </svg>
  );
};

export { IconWallet };
