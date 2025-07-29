import type { SVGProps } from 'react';

const IconDocs = ({
  size = 24,
  ...otherProps
}: SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <rect width="48" height="48" rx="6" fill="#9AEA4A" />
      <path
        d="M30.0328 8H10.6229C10.0435 8 9.57373 8.46974 9.57373 9.04918V38.9508C9.57373 39.5303 10.0435 40 10.6229 40H37.3771C37.9566 40 38.4263 39.5303 38.4263 38.9508V16.5333L30.0328 8Z"
        fill="#006579"
      />
      <rect
        x="13.7703"
        y="20.0657"
        width="20.9837"
        height="3.14754"
        fill="white"
      />
      <rect
        x="13.7703"
        y="26.3606"
        width="20.9837"
        height="3.14754"
        fill="white"
      />
      <rect
        x="13.7703"
        y="32.6558"
        width="20.9837"
        height="3.14754"
        fill="white"
      />
      <path
        d="M30.0328 16.5328L30.0328 8L38.4263 16.5328L30.0328 16.5328Z"
        fill="white"
      />
    </svg>
  );
};

export { IconDocs };
