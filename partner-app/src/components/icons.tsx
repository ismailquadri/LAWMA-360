import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;
const base = (children: React.ReactNode, props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
);

export const IconOverview = (p: IconProps) => base(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>, p);
export const IconRequests = (p: IconProps) => base(<><path d="M9 11l2 2 4-4" /><rect x="3" y="4" width="18" height="17" rx="2" /></>, p);
export const IconCustomers = (p: IconProps) => base(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.3 2.9-6 6-6s6 2.7 6 6" /><circle cx="17.5" cy="8.5" r="2.4" /><path d="M15.6 14.2a5.2 5.2 0 0 1 4.9 5.3" /></>, p);
export const IconOperations = (p: IconProps) => base(<><rect x="3" y="7" width="13" height="10" rx="1.5" /><path d="M16 10h3l2 3v4h-5" /><circle cx="7.5" cy="18.5" r="1.6" /><circle cx="17" cy="18.5" r="1.6" /></>, p);
export const IconFinance = (p: IconProps) => base(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2c0-1.1 1-2 2.5-2s2.5.8 2.5 1.8c0 2.4-5 1.6-5 4.1 0 1 1 1.9 2.5 1.9s2.5-.8 2.5-1.9" /><path d="M12 6v1.1M12 16.9V18" /></>, p);
export const IconMessages = (p: IconProps) => base(<><path d="M4 5h16v11H8l-4 4V5z" /></>, p);
export const IconLive = (p: IconProps) => base(<><circle cx="12" cy="12" r="2.5" /><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16" /></>, p);
export const IconSettings = (p: IconProps) => base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.8 1.8 0 0 0 .36 1.98l.07.07a2.2 2.2 0 1 1-3.1 3.1l-.07-.07a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V20a2.2 2.2 0 1 1-4.4 0v-.1a1.8 1.8 0 0 0-1.18-1.65 1.8 1.8 0 0 0-1.98.36l-.07.07a2.2 2.2 0 1 1-3.1-3.1l.07-.07a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.65-1.1H2a2.2 2.2 0 1 1 0-4.4h.1a1.8 1.8 0 0 0 1.65-1.18 1.8 1.8 0 0 0-.36-1.98l-.07-.07a2.2 2.2 0 1 1 3.1-3.1l.07.07a1.8 1.8 0 0 0 1.98.36H8.5a1.8 1.8 0 0 0 1.1-1.65V2a2.2 2.2 0 1 1 4.4 0v.1a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.07-.07a2.2 2.2 0 1 1 3.1 3.1l-.07.07a1.8 1.8 0 0 0-.36 1.98V8.5a1.8 1.8 0 0 0 1.65 1.1H22a2.2 2.2 0 1 1 0 4.4h-.1a1.8 1.8 0 0 0-1.65 1.1z" /></>, p);
export const IconClose = (p: IconProps) => base(<><path d="M6 6l12 12M18 6L6 18" /></>, p);
export const IconCheck = (p: IconProps) => base(<path d="M5 12.5l4.5 4.5L19 7" />, p);
export const IconSearch = (p: IconProps) => base(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>, p);
export const IconTruck = (p: IconProps) => base(<><rect x="2" y="8" width="12" height="9" rx="1.5" /><path d="M14 11h4l3 3v3h-7" /><circle cx="6.5" cy="18.5" r="1.6" /><circle cx="16.5" cy="18.5" r="1.6" /></>, p);
export const IconReset = (p: IconProps) => base(<><path d="M3 12a9 9 0 1 1 3 6.7" /><path d="M3 15v-4h4" /></>, p);
