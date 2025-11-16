import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Components
import AuthenticatedApp from './src/components/AuthenticatedApp';
import SignInScreen from './src/screens/SignInScreen';

// Configure API base URL
import { api } from '@quadrants/shared';
import Constants from 'expo-constants';

// Use environment variable if available, otherwise fallback to localhost
const apiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
api.setBaseUrl(apiUrl);

// Clerk token cache
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env');
}

export type RootStackParamList = {
  Projects: undefined;
  TaskList: { projectId: string; projectName: string };
  TaskDetail: { taskId: number; projectId: string };
  QuickAdd: { projectId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

// Component to configure auth token for API calls
function AuthTokenConfig({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  React.useEffect(() => {
    // Configure the API to use Clerk's auth token
    api.setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <AuthTokenConfig>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <PaperProvider>
                <SignedIn>
                  <AuthenticatedApp />
                </SignedIn>
                <SignedOut>
                  <SignInScreen />
                </SignedOut>
              </PaperProvider>
            </QueryClientProvider>
          </SafeAreaProvider>
        </AuthTokenConfig>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
