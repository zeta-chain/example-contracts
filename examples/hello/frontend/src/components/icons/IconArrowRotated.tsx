import type { SVGProps } from 'react';

import { useTheme } from '../../hooks/useTheme';

const IconArrowRotated = ({
  size = 34,
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
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.3934 9.91538C23.8076 9.91538 24.1434 10.2512 24.1434 10.6654L24.1434 21.3149H22.6434L22.6434 12.476L10.6655 24.454L9.60483 23.3933L21.5828 11.4154H12.7439L12.7439 9.91538L23.3934 9.91538Z"
        fill={theme === 'light' ? '#00A87D' : '#B0FF61'}
      />
    </svg>
  );
};

export { IconArrowRotated };
