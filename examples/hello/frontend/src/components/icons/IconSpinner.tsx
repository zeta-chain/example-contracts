import { type SVGProps, useId } from 'react';

const IconSpinner = ({
  size = 16,
  ...otherProps
}: SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
}) => {
  const id = useId();
  const gradientId = `spinner-gradient-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <radialGradient
        id={gradientId}
        cx=".66"
        fx=".66"
        cy=".3125"
        fy=".3125"
        gradientTransform="scale(1.5)"
      >
        <stop offset="0" stopColor="#848484"></stop>
        <stop offset=".3" stopColor="#848484" stopOpacity=".9"></stop>
        <stop offset=".6" stopColor="#848484" stopOpacity=".6"></stop>
        <stop offset=".8" stopColor="#848484" stopOpacity=".3"></stop>
        <stop offset="1" stopColor="#848484" stopOpacity="0"></stop>
      </radialGradient>
      <circle
        style={{ transformOrigin: 'center' }}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="15"
        strokeLinecap="round"
        strokeDasharray="200 1000"
        strokeDashoffset="0"
        cx="100"
        cy="100"
        r="70"
      >
        <animateTransform
          type="rotate"
          attributeName="transform"
          calcMode="spline"
          dur="2"
          values="360;0"
          keyTimes="0;1"
          keySplines="0 0 1 1"
          repeatCount="indefinite"
        ></animateTransform>
      </circle>
      <circle
        style={{ transformOrigin: 'center' }}
        fill="none"
        opacity=".2"
        stroke="#848484"
        strokeWidth="15"
        strokeLinecap="round"
        cx="100"
        cy="100"
        r="70"
      ></circle>
    </svg>
  );
};

export { IconSpinner };
