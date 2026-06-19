import React, {createContext, useContext, useState, useRef} from 'react';
import {Animated, Dimensions, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {Text} from '@/components/ui/text';
import {IconSymbol} from '@/components/ui/icon-symbol';

const {width} = Dimensions.get('window');

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({children}: {children: React.ReactNode}) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = ({message, type = 'success', duration = 3000}: ToastOptions) => {
    // Clear any existing active timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setMessage(message);
    setType(type);
    setVisible(true);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: (insets.top ?? 0) + 12,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Set timer to animate out
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
      });
    }, duration);
  };

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {name: 'checkmark.circle.fill' as const, color: C.income};
      case 'error':
        return {name: 'xmark.circle.fill' as const, color: C.expense};
      case 'warning':
        return {name: 'exclamationmark.triangle.fill' as const, color: C.warning};
      case 'info':
      default:
        return {name: 'info.circle' as const, color: C.textSecondary};
    }
  };

  const iconConfig = getIconConfig();

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <View style={styles.toastContent}>
            <IconSymbol name={iconConfig.name} size={20} color={iconConfig.color} />
            <Text
              style={{
                color: C.white,
                fontSize: 14,
                fontFamily: Fonts.sansSemiBold,
                flex: 1,
              }}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    shadowColor: C.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.black,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
