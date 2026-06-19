import React from 'react';
import { StyleSheet, View, Text, Platform, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { C } from '@/constants/colors';
import { Fonts } from '@/constants/theme';
import { Button } from './button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
        )}
        
        <View style={styles.card}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button
                label={cancelLabel}
                variant="secondary"
                size="md"
                onPress={onCancel}
                disabled={loading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={confirmLabel}
                variant={isDestructive ? 'destructive' : 'primary'}
                size="md"
                onPress={onConfirm}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    gap: 24,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  textContainer: {
    gap: 8,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: C.textPrimary,
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
