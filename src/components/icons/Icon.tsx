import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number | string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, className = '', ...props }) => {
  const iconStyle = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    display: 'inline-block',
    verticalAlign: 'middle',
    flexShrink: 0,
  };

  const svgProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: iconStyle,
    className: `i ${className}`.trim(),
    ...props,
  };

  switch (name) {
    case 'folder':
    case 'project':
      return (
        <svg {...svgProps}>
          <path d="M3 7h5l2 3h11v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7zM3 7V5a1 1 0 0 1 1-1h4l2 2" />
        </svg>
      );

    case 'chevron-down':
      return (
        <svg {...svgProps}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    case 'export':
    case 'download':
      return (
        <svg {...svgProps}>
          <path d="M12 3v13m0 0 4-4m-4 4-4-4M4 17v3h16v-3" />
        </svg>
      );

    case 'timeline':
    case 'lightning':
      return (
        <svg {...svgProps}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
      );

    case 'dashboard':
    case 'chart':
      return (
        <svg {...svgProps}>
          <path d="M4 17V7m5 10V4m5 13v-6m5 6V9" />
        </svg>
      );

    case 'tasks':
    case 'list':
      return (
        <svg {...svgProps}>
          <path d="M4 6h16M7 12h13M4 12h.01M7 18h13M4 18h.01" />
        </svg>
      );

    case 'screenplay':
    case 'document':
      return (
        <svg {...svgProps}>
          <path d="M8 3h8l4 4v14H4V3h4zm8 0v4h4M8 12h8M8 16h8M8 8h3" />
        </svg>
      );

    case 'entity':
    case 'layers':
      return (
        <svg {...svgProps}>
          <path d="M4 6a8 3 0 0 0 16 0a8 3 0 0 0-16 0zm0 0v12a8 3 0 0 0 16 0V6M4 12a8 3 0 0 0 16 0" />
        </svg>
      );

    case 'check':
    case 'check-circle':
      return (
        <svg {...svgProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );

    case 'close':
    case 'x':
      return (
        <svg {...svgProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );

    case 'alert':
    case 'warning':
      return (
        <svg {...svgProps}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );

    case 'info':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );

    case 'lock':
    case 'shield':
      return (
        <svg {...svgProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );

    case 'plus':
      return (
        <svg {...svgProps}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );

    case 'search':
      return (
        <svg {...svgProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );

    case 'refresh':
    case 'retry':
      return (
        <svg {...svgProps}>
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      );

    case 'key':
      return (
        <svg {...svgProps}>
          <path d="M21 2l-2 2m-2 2l-2 2m2-2l2 2m-7 1a5 5 0 1 1-7 7 5 5 0 0 1 7-7zm0 0l4-4" />
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
};

export default Icon;
