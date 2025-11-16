import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';

interface ErrorViewProps {
  error: Error | string;
  onRetry?: () => void;
}

export default function ErrorView({ error, onRetry }: ErrorViewProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <IconButton icon="alert-circle" size={64} iconColor="#ef4444" />
      </View>
      <Text variant="headlineSmall" style={styles.title}>
        Failed to Load
      </Text>
      <Text variant="bodyMedium" style={styles.message}>
        {errorMessage}
      </Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry} style={styles.button}>
          Retry
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  message: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
});
