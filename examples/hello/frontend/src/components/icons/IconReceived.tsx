import type { SVGProps } from 'react';

const IconReceived = ({
  ...otherProps
}: SVGProps<SVGSVGElement> & {
  className?: string;
}) => {
  return (
    <svg
      width="144"
      height="88"
      viewBox="0 0 144 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <rect y="13" width="144" height="62" rx="8.91986" fill="#008462" />

      <rect x="16" y="34" width="20" height="20" rx="10" fill="#B0FF61" />

      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M30.2353 42.0737L25.6414 46.66C25.3444 46.9565 24.8628 46.9565 24.5658 46.66L22 44.0984L23.0755 43.0247L25.1036 45.0494L29.1597 41L30.2353 42.0737Z"
        fill="black"
      />

      <rect x="44" y="34" width="84" height="8" fill="#B0FF61" />

      <rect x="44" y="46" width="84" height="8" fill="#B0FF61" />
    </svg>
  );
};

export { IconReceived };
