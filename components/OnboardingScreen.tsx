import {Image} from 'expo-image';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import {useRef, useState} from 'react';
import {
  Dimensions,
  FlatList,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import {Button} from '@/components/ui/button';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {Text} from '@/components/ui/text';
import {storage} from '@/lib/storage';

const {width} = Dimensions.get('window');

type IconName = React.ComponentProps<typeof IconSymbol>['name'];

type OnboardingPage = {
  id: string;
  title: string;
  highlight: string;
  body: string;
  logo?: boolean;
  symbol?: IconName;
  hasTerms?: boolean;
};

const PAGES: OnboardingPage[] = [
  {
    id: 'welcome',
    logo: true,
    title: 'Secure Private',
    highlight: 'Expense Tracking',
    body: 'Take control of your finances with military-grade encryption and premium analytics designed for you.',
  },
  {
    id: 'analytics',
    symbol: 'chart.bar.xaxis',
    title: 'Track Every',
    highlight: 'Transaction',
    body: 'Visualize spending patterns with detailed insights and reports that help you make smarter financial decisions.',
  },
  {
    id: 'security',
    symbol: 'lock.shield.fill',
    title: 'Your data is',
    highlight: 'completely secure',
    body: 'We use military-grade encryption. Your financial data is private and never shared.',
    hasTerms: true,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingPage>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const isLast = currentIndex === PAGES.length - 1;

  const goNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isLast) {
      listRef.current?.scrollToIndex({index: currentIndex + 1, animated: true});
    } else {
      try {
        await storage.setOnboardingCompleted();
      } catch {}
      router.replace('/sign-up');
    }
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex > 0) {
      listRef.current?.scrollToIndex({index: currentIndex - 1, animated: true});
    }
  };

  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: ViewToken[]}) => {
    if (viewableItems[0]?.index != null) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const renderPage = ({item}: {item: OnboardingPage}) => (
    <View
      style={{
        width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        gap: 24,
        paddingBottom: 160, // Extra space at bottom to ensure no text overlaps the absolute footer
      }}>
      {/* ── Hero icon ── */}
      <View style={{alignItems: 'center', width: '100%'}}>
        {item.logo ? (
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 48,
              backgroundColor: C.bgCard,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Image
              source={require('@/assets/images/vaultvoss.png')}
              style={{width: 96, height: 96}}
              contentFit='contain'
            />
          </View>
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 36,
              backgroundColor: C.bgCard,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <IconSymbol
              name={item.symbol!}
              size={52}
              color={C.accent}
            />
          </View>
        )}
      </View>

      {/* ── Copy ── */}
      <View style={{gap: 6, width: '100%', alignItems: 'center'}}>
        <Text
          variant='heading'
          style={{
            fontFamily: Fonts.sansBold,
            fontSize: 34,
            color: C.textPrimary,
            textAlign: 'center',
            letterSpacing: -0.5,
            lineHeight: 40,
          }}>
          {item.title}
        </Text>
        <Text
          variant='heading'
          style={{
            fontFamily: Fonts.sansBold,
            fontSize: 34,
            color: C.accent,
            textAlign: 'center',
            letterSpacing: -0.5,
            lineHeight: 40,
            marginBottom: 8,
          }}>
          {item.highlight}
        </Text>
        <Text
          variant='body'
          color='secondary'
          style={{
            fontFamily: Fonts.sans,
            fontSize: 15,
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 8,
          }}>
          {item.body}
        </Text>
      </View>



      {/* ── Terms card ── */}
      {item.hasTerms && (
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.bgCard,
            padding: 16,
            width: '100%',
          }}>
          <Text
            variant='caption'
            color='muted'
            style={{
              fontFamily: Fonts.sans,
              fontSize: 12,
              lineHeight: 20,
              textAlign: 'center',
            }}>
            By continuing, you agree to our{' '}
            <Text
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/terms');
              }}
              style={{fontFamily: Fonts.sansSemiBold, color: C.accent, fontSize: 12}}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/privacy');
              }}
              style={{fontFamily: Fonts.sansSemiBold, color: C.accent, fontSize: 12}}>
              Privacy Policy
            </Text>.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      <View style={{height: insets.top ?? 0}} />

      <FlatList
        ref={listRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{flex: 1}}
        getItemLayout={(_, index) => ({length: width, offset: width * index, index})}
      />

      {/* ── Footer ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: C.bg,
          paddingHorizontal: 24,
          gap: 16,
          paddingBottom: Math.max(insets.bottom ?? 0, 8) + 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: C.border + '11', // Very faint border to separate on web
        }}>
        {/* Dots */}
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8}}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={{
                height: 6,
                borderRadius: 3,
                width: i === currentIndex ? 24 : 6,
                backgroundColor: i === currentIndex ? C.accent : C.border,
              }}
            />
          ))}
        </View>

        {/* CTA */}
        <Button
          variant="accent"
          size="lg"
          onPress={goNext}
          label={isLast ? 'Get Started' : 'Next  →'}
        />
      </View>

      {/* ── Skip ── */}
      <TouchableOpacity
        onPress={async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          try {
            await storage.setOnboardingCompleted();
          } catch {}
          router.replace('/login');
        }}
        hitSlop={12}
        style={{position: 'absolute', top: (insets.top ?? 0) + 12, right: 24}}>
        <Text variant='body' color='secondary' style={{fontFamily: Fonts.sansSemiBold, fontSize: 15}}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* ── Back ── */}
      {currentIndex > 0 && (
        <TouchableOpacity
          onPress={goBack}
          hitSlop={12}
          activeOpacity={0.7}
          style={{
            position: 'absolute',
            top: (insets.top ?? 0) + 8,
            left: 20,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: C.bgCard,
            borderWidth: 1,
            borderColor: C.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text variant='body' color='primary' style={{fontSize: 22, fontWeight: '300', lineHeight: 26, marginTop: -2}}>
            ‹
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
