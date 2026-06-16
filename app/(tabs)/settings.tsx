import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useLogout, useMe} from '@/hooks/use-auth';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Alert, Image, Platform, Pressable, ScrollView, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const GRID_ITEMS = [
  {label: 'Profile', sub: 'Login, authenticator', icon: 'person.fill', route: '/profile'},
  {label: 'Budget Goals', sub: 'Spending limits', icon: 'chart.pie.fill', route: '/budget-goals'},
  {label: 'Recurring', sub: 'Auto transactions', icon: 'arrow.clockwise', route: '/recurring'},
  {label: 'Net Worth', sub: 'Assets & liabilities', icon: 'chart.bar.fill', route: '/net-worth'},
  {label: 'Analytics', sub: 'Reports & insights', icon: 'waveform.path.ecg', route: '/(tabs)/analytics'},
  {label: 'Security', sub: 'Biometrics & login', icon: 'lock.shield', route: '/security'},
  {label: 'Currency', sub: 'Set default symbol', icon: 'dollarsign', route: '/currency'},
  {label: 'Notifications', sub: 'Alerts & reminders', icon: 'bell', route: '/notifications'},
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {data: me} = useMe();
  const logoutMutation = useLogout();

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 110}}>
        {/* Header */}
        <View style={{paddingTop: insets.top + 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28}}>
          <View style={{gap: 2}}>
            <Text variant='caption' color='secondary'>Signed in as</Text>
            <Text variant='title' color='primary'>{me?.full_name ?? '—'}</Text>
            <Text variant='caption' color='secondary'>{me?.email ?? ''}</Text>
          </View>
          {/* Avatar */}
          <View style={{width: 52, height: 52, borderRadius: 26, backgroundColor: C.accentDim, borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
            {me?.profile_image_url ? (
              <Image source={{uri: me.profile_image_url}} style={{width: 52, height: 52}} resizeMode='cover' />
            ) : (
              <Text variant='heading' color='accent' style={{fontSize: 22}}>
                {me?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            )}
          </View>
        </View>

        {/* Grid */}
        <View style={{paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24}}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.route) router.push(item.route as any);
              }}
              activeOpacity={0.7}
              style={{
                width: (Platform.OS === 'web' ? 340 : ((340 - 12) / 2)),
                flex: 1,
                minWidth: 150,
                backgroundColor: C.bgCard,
                borderRadius: 20,
                borderWidth: 1, borderColor: C.border,
                padding: 20, gap: 28,
              }}>
              <View style={{width: 44, height: 44, borderRadius: 14, backgroundColor: C.brandBlueDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.brandBlue + '11'}}>
                <IconSymbol name={item.icon as any} size={22} color={C.brandBlue} />
              </View>
              <View style={{gap: 3}}>
                <Text variant='subheading' color='primary'>{item.label}</Text>
                <Text variant='caption' color='secondary'>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={{paddingHorizontal: 20}}>
          <TouchableOpacity
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Sign Out', style: 'destructive',
                  onPress: () => {
                    logoutMutation.mutate(undefined, {
                      onSuccess: () => {
                        router.replace('/login');
                      },
                    });
                  }
                }
              ]);
            }}
            activeOpacity={0.75}
            style={{
              height: 54, borderRadius: 16,
              backgroundColor: C.expenseDim,
              borderWidth: 1, borderColor: `${C.expense}55`,
              alignItems: 'center', justifyContent: 'center',
            }}>
            <Text variant='subheading' style={{color: C.expense, fontFamily: Fonts.sansSemiBold}}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
