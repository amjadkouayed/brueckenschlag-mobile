import { Tabs } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { colors, font, radius, text } from '@/lib/theme'

/**
 * Four tabs, each with a word under it — no icon-only navigation anywhere in
 * Linde. The icons are plain geometry (ring, pill, two circles, dot), never
 * botanical, and the active tab is a filled pill so "where am I" survives poor
 * contrast and older eyes.
 *
 * Plain Tabs rather than native tabs: the labels have to stay 15px and German,
 * and the active pill is not something the native bar draws.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="entdecken"
        options={{
          title: 'Entdecken',
          tabBarIcon: ({ focused }) => <TabItem label="Entdecken" focused={focused} shape="ring" />,
        }}
      />
      <Tabs.Screen
        name="angebot"
        options={{
          title: 'Angebot',
          tabBarIcon: ({ focused }) => <TabItem label="Angebot" focused={focused} shape="pill" />,
        }}
      />
      <Tabs.Screen
        name="kontakte"
        options={{
          title: 'Kontakte',
          tabBarIcon: ({ focused }) => <TabItem label="Kontakte" focused={focused} shape="pair" />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabItem label="Profil" focused={focused} shape="dot" />,
        }}
      />
    </Tabs>
  )
}

function TabItem({
  label,
  focused,
  shape,
}: {
  label: string
  focused: boolean
  shape: 'ring' | 'pill' | 'pair' | 'dot'
}) {
  const tint = focused ? colors.surface : colors.ink

  return (
    <View style={[styles.tab, focused && styles.tabActive]}>
      <View style={styles.icons}>
        {shape === 'pair' ? (
          <>
            <View style={[styles.ring, { borderColor: tint }]} />
            <View style={[styles.ring, { borderColor: tint, marginLeft: -6 }]} />
          </>
        ) : shape === 'pill' ? (
          <View style={[styles.pill, focused ? { backgroundColor: tint } : { borderColor: tint, borderWidth: 2.5 }]} />
        ) : shape === 'dot' ? (
          <View style={[styles.dot, focused ? { backgroundColor: tint } : { borderColor: tint, borderWidth: 2.5 }]} />
        ) : (
          <View style={[styles.dot, { borderColor: tint, borderWidth: 2.5 }]} />
        )}
      </View>
      <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.tag,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    height: 86,
    paddingTop: 8,
    paddingBottom: 8,
  },
  item: { paddingVertical: 0 },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.card,
    minWidth: 76,
  },
  tabActive: { backgroundColor: colors.brand },
  icons: { flexDirection: 'row', height: 20, alignItems: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10 },
  ring: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5 },
  pill: { width: 24, height: 12, borderRadius: 6 },
  label: { fontFamily: font.sansBold, fontSize: text.meta },
})
