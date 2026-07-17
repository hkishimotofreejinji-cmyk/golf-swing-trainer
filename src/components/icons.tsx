import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function IconHome(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v10h12V10" />
    </svg>
  )
}

export function IconRecord(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconHistory(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </svg>
  )
}

export function IconRounds(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 21h7" />
      <path d="M9 21V4" />
      <path d="M9 4l7 3.4L9 9.8z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconKnowledge(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 4h11a1 1 0 011 1v15l-6.5-3.5L5 20V5a1 1 0 011-1z" />
      <path d="M10.3 9.3l4 2.2-4 2.2z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8h16" />
      <path d="M4 16h16" />
      <circle cx="9" cy="8" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconChecklist(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 3.2h6v2.2H9z" />
      <path d="M6 5.4h12v16H6z" />
      <path d="M9 13l2 2 4-4.4" />
    </svg>
  )
}

export function IconCompass(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9l-2.4 5.4L9.6 15 12 9.6z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.6l9 15.8H3z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconCoach(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h16v11H9.5L5 20v-4H4z" />
    </svg>
  )
}

export function IconAim(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2.8v3.4" />
      <path d="M12 17.8v3.4" />
      <path d="M2.8 12h3.4" />
      <path d="M17.8 12h3.4" />
    </svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function IconBulb(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3a6 6 0 00-3 11.2c.9.7.9 1.5.9 2.3h4.2c0-.8 0-1.6.9-2.3A6 6 0 0012 3z" />
      <path d="M9.8 19h4.4" />
      <path d="M10.6 21.4h2.8" />
    </svg>
  )
}

export function IconPending(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3.2 3.2" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2.2, ...props })}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2, ...props })}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}
