import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/ui/TabBar';

export default function TabLayout() {
  return (
    // No cross-screen animation: tab switches should be instant, like native
    // apps — the moving highlight in the bar is the only motion.
    <Tabs screenOptions={{ headerShown: false, animation: 'none' }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Library' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
