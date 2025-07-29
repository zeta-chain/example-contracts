import type { SVGProps } from 'react';

const IconTutorials = ({
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
      <rect y="0.000244141" width="48.0002" height="48" fill="#006579" />
      <ellipse cx="17.2002" cy="24.0002" rx="10" ry="10" fill="#B0FF61" />
      <ellipse cx="30.8002" cy="24.0002" rx="10" ry="10" fill="#00BC8D" />
      <path
        d="M24.0002 16.6697C25.9679 18.4959 27.2004 21.1035 27.2004 23.9998C27.2004 26.8957 25.9676 29.5027 24.0002 31.3289C22.0329 29.5027 20.8 26.8958 20.8 23.9998C20.8001 21.1035 22.0325 18.4959 24.0002 16.6697Z"
        fill="#00D5FF"
      />
    </svg>
  );
};

export { IconTutorials };
