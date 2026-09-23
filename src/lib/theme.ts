/**
 * Linde's design tokens, identical to the web app's.
 *
 * The two border colours are darker than they look like they should be, on
 * purpose: the original design failed WCAG at 3.4:1 for muted text and 1.4:1
 * for input borders. These measure 5.4:1 and 3.5:1. Do not lighten them.
 *
 * No dark mode. Ivory and forest green are the brand, and a second palette
 * would be a second thing to get wrong in a week.
 */
export const colors = {
  surface: '#F6F1E3',
  raised: '#FFFCF4',
  ink: '#2F2B1E',
  muted: '#69624C',
  brand: '#55713F',
  brandPressed: '#3F5630',
  accent: '#C99A3E',
  tag: '#EDE3C8',
  line: '#D9CBA3',
  control: '#948659',
  white: '#FFFFFF',
} as const

export const font = {
  serif: 'Bitter_700Bold',
  serifSemi: 'Bitter_600SemiBold',
  sans: 'Karla_400Regular',
  sansBold: 'Karla_700Bold',
  sansSemi: 'Karla_600SemiBold',
} as const

/**
 * Body text starts at 17. The floor is 15 and applies to chips and timestamps
 * too — most of the people reading this are over 65.
 */
export const text = {
  title: 28,
  heading: 22,
  name: 21,
  body: 18,
  label: 17,
  button: 19,
  small: 16,
  meta: 15,
} as const

export const radius = {
  card: 18,
  button: 14,
  input: 12,
  pill: 999,
} as const

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
} as const

/** Touch targets: 48 minimum, 60 for anything primary. */
export const touch = {
  min: 48,
  primary: 60,
} as const
