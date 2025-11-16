import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, Divider } from 'react-native-paper';
import { useSignIn } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth } from '@clerk/clerk-expo';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  const onGoogleSignIn = React.useCallback(async () => {
    try {
      // Try to dismiss any existing browser session (ignore if none exists)
      try {
        await WebBrowser.dismissBrowser();
      } catch (dismissError) {
        // Ignore error if there's no browser to dismiss
      }

      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('OAuth error:', err);

      // Handle specific "browser already open" error
      if (err.message?.includes('browser is already open') ||
          err.message?.includes('openAuthSessionAsync')) {
        alert('Please close the previous sign-in window and try again.');
      } else {
        alert('Google sign-in failed: ' + (err.message || 'Unknown error'));
      }
    }
  }, [startGoogleOAuth]);

  const onEmailPasswordSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn?.create({
        identifier: email.trim(),
        password: password.trim(),
      });

      if (result?.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
      } else {
        alert('Sign-in failed, please check your email and password');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      alert('Sign-in failed: ' + (err.errors?.[0]?.message || err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome to Quadrants
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Four Quadrant Task Manager
          </Text>

          <View style={styles.buttonContainer}>
            {/* Google OAuth Sign In */}
            <Button
              mode="contained"
              onPress={onGoogleSignIn}
              style={styles.button}
              contentStyle={styles.buttonContent}
              disabled={!isLoaded}
              icon="google"
            >
              Sign in with Google
            </Button>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={styles.dividerText}>
                or
              </Text>
              <Divider style={styles.divider} />
            </View>

            {/* Toggle to Email/Password Sign In */}
            {!showPasswordLogin ? (
              <Button
                mode="outlined"
                onPress={() => setShowPasswordLogin(true)}
                style={styles.button}
                contentStyle={styles.buttonContent}
                icon="email"
              >
                Sign in with Email & Password
              </Button>
            ) : (
              <View style={styles.formContainer}>
                <TextInput
                  mode="outlined"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  style={styles.input}
                  disabled={isLoading}
                />
                <TextInput
                  mode="outlined"
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  style={styles.input}
                  disabled={isLoading}
                />
                <Button
                  mode="contained"
                  onPress={onEmailPasswordSignIn}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  loading={isLoading}
                  disabled={isLoading || !email.trim() || !password.trim()}
                >
                  Sign In
                </Button>
                <Button
                  mode="text"
                  onPress={() => {
                    setShowPasswordLogin(false);
                    setEmail('');
                    setPassword('');
                  }}
                  style={styles.button}
                  disabled={isLoading}
                >
                  Back to other sign-in options
                </Button>
              </View>
            )}
          </View>

          <Text variant="bodySmall" style={styles.hint}>
            First sign-in will automatically create an account
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 48,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  hint: {
    marginTop: 24,
    textAlign: 'center',
    color: '#666',
  },
});
