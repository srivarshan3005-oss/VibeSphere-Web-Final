import type { SVGProps } from 'react';

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.2-4.2',
  plus: 'M12 5v14M5 12h14',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0',
  heart: 'M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.5c0 6.1-8 11-8 11z',
  comment: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  close: 'M6 6l12 12M18 6 6 18',
  image: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 11 5-5 4 4 3-3 5 5M8.5 9.5h.01',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  logout: 'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4',
  back: 'M15 5l-7 7 7 7',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  check: 'M5 12.5 10 17.5 19 7',
  alert: 'M12 3 2 20h20zM12 10v4.5M12 17.5h.01',
  chevronRight: 'M9 5l7 7-7 7',
  chevronLeft: 'M15 5l-7 7 7 7',
  refresh: 'M20 11a8 8 0 1 0-2.3 6M20 4v7h-7',
  wifiOff: 'M3 3l18 18M9 17a4 4 0 0 1 6 0M5.5 12.5A9 9 0 0 1 9 10.6M15 10.6a9 9 0 0 1 3.5 1.9M2 8.8a14 14 0 0 1 5-3M10 5.1a14 14 0 0 1 12 3.7M12 20.5h.01',
} as const;

export type IconName = keyof typeof PATHS;

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName; size?: number; filled?: boolean };

/** Decorative by default (aria-hidden); the surrounding button or link carries the accessible name. */
export default function Icon({ name, size = 22, filled = false, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
