import { Image } from 'expo-image'
import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
} from 'react-native'

import { avatarUrl } from '@/lib/supabase'
import { colors, font, radius, space, text, touch } from '@/lib/theme'

/**
 * The building blocks every screen reuses. Kept in one file on purpose: it is
 * the whole vocabulary of the app, and one file is easier to keep consistent
 * than a folder of near-identical ones.
 *
 * Rules that are not negotiable, because the audience is mostly over 65:
 * text never below 15, targets never below 48, every control carries a word.
 */

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.mutedText]}>{children}</Text>
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.small}>{children}</Text>
}

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  )
}

type ButtonProps = PressableProps & {
  title: string
  variant?: 'primary' | 'secondary' | 'text'
  loading?: boolean
}

export function Button({ title, variant = 'primary', loading, disabled, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      // Press feedback is a scale, not a colour change — the design's one
      // universal signal that the app heard you.
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'text' && styles.buttonText,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.ink} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            variant === 'primary' && styles.buttonLabelPrimary,
            variant === 'text' && styles.buttonLabelText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

export function Field({
  label,
  hint,
  error,
  ...rest
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        accessibilityLabel={label}
        {...rest}
      />
      {hint && <Text style={styles.small}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

export function Chip({
  label,
  active,
  onPress,
  kind = 'choice',
}: {
  label: string
  active?: boolean
  onPress?: () => void
  kind?: 'choice' | 'fact'
}) {
  // A fact (age, place, availability) looks different from a choice (interest):
  // one describes the person, the other is something they picked.
  const content = (
    <Text style={[styles.chipLabel, active && styles.chipLabelActive, kind === 'fact' && styles.factLabel]}>
      {label}
    </Text>
  )
  const box = [styles.chip, kind === 'fact' && styles.factChip, active && styles.chipActive]

  if (!onPress) return <View style={box}>{content}</View>

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [...box, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  )
}

export function Avatar({ name, path, size = 64 }: { name?: string | null; path?: string | null; size?: number }) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  const box = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1.5,
    borderColor: colors.line,
  }

  if (path) {
    return <Image source={{ uri: avatarUrl(path) }} style={box} contentFit="cover" transition={150} />
  }

  return (
    <View style={[box, styles.avatarFallback]}>
      <Text style={[styles.initials, { fontSize: Math.round(size / 3) }]}>{initials}</Text>
    </View>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <View style={styles.errorNote} accessibilityLiveRegion="polite">
      <Text style={styles.errorNoteText}>{children}</Text>
    </View>
  )
}

export function Loading({ label = 'Einen Moment …' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={styles.small}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: font.serif, fontSize: text.title, color: colors.ink },
  heading: { fontFamily: font.serifSemi, fontSize: text.heading, color: colors.ink },
  body: { fontFamily: font.sans, fontSize: text.body, lineHeight: text.body * 1.45, color: colors.ink },
  small: { fontFamily: font.sans, fontSize: text.small, lineHeight: text.small * 1.4, color: colors.muted },
  mutedText: { color: colors.muted },
  label: { fontFamily: font.sansBold, fontSize: text.label, color: colors.ink },
  error: { fontFamily: font.sansBold, fontSize: text.small, color: colors.brandPressed },

  card: {
    backgroundColor: colors.raised,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    gap: space.sm,
  },

  button: {
    minHeight: touch.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonPrimary: { backgroundColor: colors.brand },
  buttonSecondary: { backgroundColor: colors.raised, borderWidth: 2, borderColor: colors.control },
  buttonText: { backgroundColor: 'transparent', minHeight: touch.min },
  buttonLabel: { fontFamily: font.sansBold, fontSize: text.button, color: colors.ink },
  buttonLabelPrimary: { color: colors.surface },
  buttonLabelText: { color: colors.muted, textDecorationLine: 'underline' },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.6 },

  input: {
    minHeight: touch.min,
    borderWidth: 2,
    borderColor: colors.control,
    borderRadius: radius.input,
    backgroundColor: colors.raised,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontFamily: font.sans,
    fontSize: text.body,
    color: colors.ink,
  },

  chip: {
    minHeight: touch.min,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.control,
    backgroundColor: colors.raised,
    paddingHorizontal: 18,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipLabel: { fontFamily: font.sansBold, fontSize: text.label, color: colors.ink },
  chipLabelActive: { color: colors.surface },
  factChip: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: colors.control,
    backgroundColor: colors.raised,
    paddingHorizontal: 13,
  },
  factLabel: { fontFamily: font.sansBold, fontSize: text.meta, color: colors.muted },

  avatarFallback: {
    backgroundColor: colors.tag,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: font.serifSemi, color: colors.muted },

  errorNote: {
    borderWidth: 2,
    borderColor: colors.control,
    backgroundColor: colors.tag,
    borderRadius: radius.input,
    padding: space.md,
  },
  errorNoteText: { fontFamily: font.sansBold, fontSize: text.label, color: colors.ink },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
})
