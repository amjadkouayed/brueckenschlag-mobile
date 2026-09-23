import { View } from 'react-native'

import { colors } from '@/lib/theme'

/**
 * Two overlapping circles with a gold lens where they meet.
 *
 * Drawn with views rather than SVG so the app needs no SVG dependency for one
 * logo. Never a leaf: despite the name, botanical shapes would read as a
 * flower shop.
 */
export function LindeMark({ size = 40 }: { size?: number }) {
  const big = size * 0.6
  const small = size * 0.44

  return (
    <View style={{ width: size, height: size, justifyContent: 'center' }} accessibilityElementsHidden>
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: big,
          height: big,
          borderRadius: big / 2,
          backgroundColor: colors.brand,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.34,
          width: small,
          height: small,
          borderRadius: small / 2,
          backgroundColor: colors.brand,
          top: (size - small) / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.34,
          width: size * 0.26,
          height: small,
          borderTopLeftRadius: small / 2,
          borderBottomLeftRadius: small / 2,
          borderTopRightRadius: small / 2,
          borderBottomRightRadius: small / 2,
          backgroundColor: colors.accent,
          top: (size - small) / 2,
        }}
      />
    </View>
  )
}
