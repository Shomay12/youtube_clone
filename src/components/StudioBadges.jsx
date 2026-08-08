import React from 'react';

export const StudioCheckBadge = ({ size = 20, style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0, ...style }}
    className={className}
  >
    <circle cx="10" cy="10" r="8.5" stroke="#25b84c" strokeWidth="1.8" fill="none" />
    <path d="M6 10.2L8.8 13L14.2 7" stroke="#25b84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StudioUpBadge = ({ size = 20, style = {}, className = '', color = '#25b84c' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0, ...style }}
    className={className}
  >
    <circle cx="10" cy="10" r="9.5" fill={color} />
    <path d="M10 14.5V5.5M10 5.5L5.8 9.7M10 5.5L14.2 9.7" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StudioDownBadge = ({ size = 20, style = {}, className = '', color = '#25b84c' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0, ...style }}
    className={className}
  >
    <circle cx="10" cy="10" r="9.5" fill={color} />
    <path d="M10 5.5V14.5M10 14.5L5.8 10.3M10 14.5L14.2 10.3" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
