import type { SVGProps } from 'react';

const IconEnvelope = ({
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
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.75 6.25H22.25V18.75H2.75V6.25ZM5.60778 7.75L10.6959 11.8959L11.8066 12.6364C12.2265 12.9163 12.7735 12.9163 13.1934 12.6364L14.3041 11.8959L19.3922 7.75H5.60778ZM20.75 8.57856L15.9373 12.5L20.75 16.4214V8.57856ZM19.3922 17.25L14.7054 13.4311L14.0254 13.8844C13.1017 14.5003 11.8983 14.5003 10.9746 13.8844L10.2946 13.4311L5.60778 17.25H19.3922ZM4.25 16.4214V8.57856L9.06268 12.5L4.25 16.4214Z"
        fill="currentColor"
      />
    </svg>
  );
};

export { IconEnvelope };
