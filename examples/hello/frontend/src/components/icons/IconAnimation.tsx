import type { SVGProps } from 'react';

const IconAnimation = ({
  ...otherProps
}: SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
}) => {
  return (
    <svg
      width="568"
      height="184"
      viewBox="0 0 568 184"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
      }}
      {...otherProps}
    >
      <rect
        x="403"
        y="61"
        width="144"
        height="62"
        rx="8.91986"
        fill="#008462"
      />
      <rect x="419" y="82" width="20" height="20" rx="10" fill="#00BC8D" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M433.235 90.0737L428.641 94.66C428.344 94.9565 427.863 94.9565 427.566 94.66L425 92.0984L426.076 91.0247L428.104 93.0494L432.16 89L433.235 90.0737Z"
        fill="#007457"
      />
      <rect x="447" y="82" width="84" height="8" fill="#00BC8D" />
      <rect x="447" y="94" width="84" height="8" fill="#00BC8D" />
      <rect
        x="200.814"
        y="90.3587"
        width="166.504"
        height="2.97329"
        fill="#EFF1F4"
      />
      <rect x="195" y="90.0001" width="116" height="3" fill="#00C6EE" />
      <path
        d="M194.866 77.8455L208.866 91.8455L194.866 105.846L180.866 91.8455L194.866 77.8455Z"
        fill="#00C6EE"
      />
      <path
        d="M252.866 77.8455L266.866 91.8455L252.866 105.846L238.866 91.8455L252.866 77.8455Z"
        fill="#00C6EE"
      />
      <path
        d="M310.866 77.8455L324.866 91.8455L310.866 105.846L296.866 91.8455L310.866 77.8455Z"
        fill="#00C6EE"
      />
      <path
        d="M368.866 77.8455L382.866 91.8455L368.866 105.846L354.866 91.8455L368.866 77.8455Z"
        fill="#E5E8EC"
      />
      <path
        d="M347.924 35C351.208 35.0002 353.87 37.6623 353.87 40.9463V61.0537C353.87 64.3377 351.208 66.9998 347.924 67H317.87L310.87 74L303.87 67H271.816C268.532 66.9998 265.87 64.3377 265.87 61.0537V40.9463C265.87 37.6623 268.532 35.0002 271.816 35H347.924Z"
        fill="#00B8DD"
      />
      <path
        d="M302 55H294V47H302V55ZM313.999 55H305.999V47H313.999V55ZM325.999 55H317.999V47H325.999V55Z"
        fill="#B0FF61"
      />
      <rect x="20" y="61" width="144" height="62" rx="8.91986" fill="#008462" />
      <rect x="36" y="82" width="20" height="20" rx="10" fill="#00BC8D" />
      <rect x="64" y="82" width="84" height="8" fill="#00BC8D" />
      <rect x="64" y="94" width="84" height="8" fill="#00BC8D" />
    </svg>
  );
};

export { IconAnimation };
