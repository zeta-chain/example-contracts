import type { SVGProps } from 'react';

import { useTheme } from '../../hooks/useTheme';

const IconDisconnect = ({
  size = 16,
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
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.83366 4.66667C4.83366 2.91777 6.25142 1.5 8.00033 1.5C9.74923 1.5 11.167 2.91777 11.167 4.66667V6.83333H13.8337V12.6667C13.8337 13.6792 13.0128 14.5 12.0003 14.5H4.00033C2.9878 14.5 2.16699 13.6792 2.16699 12.6667V6.83333H4.83366V4.66667ZM5.83366 6.83333H10.167V4.66667C10.167 3.47005 9.19694 2.5 8.00033 2.5C6.80371 2.5 5.83366 3.47005 5.83366 4.66667V6.83333ZM3.16699 7.83333V12.6667C3.16699 13.1269 3.54009 13.5 4.00033 13.5H12.0003C12.4606 13.5 12.8337 13.1269 12.8337 12.6667V7.83333H3.16699ZM8.50033 9.5V11.8333H7.50033V9.5H8.50033Z"
        fill={theme === 'light' ? '#696E75' : '#A9ACB0'}
      />
    </svg>
  );
};

export { IconDisconnect };
