import type { SVGProps } from 'react';

import { useTheme } from '../../hooks/useTheme';

const IconApprove = ({
  size = 88,
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
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <rect
        x="8.80029"
        width="70.4"
        height="88"
        rx="8"
        fill={theme === 'light' ? '#00A87D' : '#005741'}
      />
      <rect
        x="17.6001"
        y="33"
        width="17.6"
        height="4.4"
        rx="2.2"
        fill={theme === 'light' ? '#008462' : '#007457'}
      />
      <rect
        x="17.6001"
        y="40.3333"
        width="52.8"
        height="4.4"
        rx="2.2"
        fill={theme === 'light' ? '#00BC8D' : '#00946E'}
      />
      <rect
        x="17.6001"
        y="47.6667"
        width="52.8"
        height="4.4"
        rx="2.2"
        fill={theme === 'light' ? '#00BC8D' : '#00946E'}
      />
      <rect
        x="17.6001"
        y="55"
        width="35.2"
        height="4.4"
        rx="2.2"
        fill={theme === 'light' ? '#00BC8D' : '#00946E'}
      />
      <rect
        x="14.6665"
        y="71.1333"
        width="28.3333"
        height="11.7333"
        rx="5.86667"
        fill={theme === 'light' ? '#008462' : '#004937'}
      />
      <rect
        x="45"
        y="71.1332"
        width="28.3333"
        height="11.7333"
        rx="5.86667"
        fill={theme === 'light' ? '#00DDA5' : '#00A87D'}
      />
      <rect
        x="35.9336"
        y="8.20001"
        width="17.6"
        height="17.6"
        rx="8.8"
        fill={theme === 'light' ? '#00BC8D' : '#007457'}
      />
      <path
        d="M46.888 18.7023V19.7422H42.598C42.6572 19.0578 42.878 18.5762 43.6418 17.8991L46.888 15.1297V17.5599H48.0565V13.0889H41.4114V15.3175H42.5796V14.2575H46.1097L42.8793 17.014L42.8716 17.0213C41.5178 18.2198 41.4102 19.1873 41.4102 20.3271V20.9112H48.0561V18.7027H46.8876L46.888 18.7023Z"
        fill={theme === 'light' ? '#00664C' : '#00BC8D'}
      />
    </svg>
  );
};

export { IconApprove };
