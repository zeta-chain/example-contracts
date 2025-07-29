import type { SVGProps } from 'react';

const IconSendTitle = ({
  ...otherProps
}: SVGProps<SVGSVGElement> & {
  className?: string;
}) => {
  return (
    <svg
      width="32"
      height="17"
      viewBox="0 0 32 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Send title icon"
      {...otherProps}
    >
      <rect y="0.5" width="32" height="16" rx="2.3019" fill="#00A5C6" />
      <rect
        x="4"
        y="5.91937"
        width="5.16129"
        height="5.16129"
        rx="2.58065"
        fill="#B0FF61"
      />
      <rect
        x="11.1614"
        y="5.91937"
        width="16.8387"
        height="2.06452"
        fill="#A03595"
      />
      <rect
        x="11.1614"
        y="9.01617"
        width="16.8387"
        height="2.06452"
        fill="#A03595"
      />
    </svg>
  );
};

export { IconSendTitle };
