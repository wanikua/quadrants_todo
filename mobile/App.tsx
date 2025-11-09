import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import ProjectsScreen from './src/screens/ProjectsScreen';
import TaskListScreen from './src/screens/TaskListScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import QuickAddScreen from './src/screens/QuickAddScreen';

// Configure API base URL
import { api } from '@quadrants/shared';
api.setBaseUrl('http://localhost:3000'); // Change for production

export type RootStackParamList = {
  Projects: undefined;
  TaskList: { projectId: string; projectName: string };
  TaskDetail: { taskId: number; projectId: string };
  QuickAdd: { projectId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Projects">
              <Stack.Screen
                name="Projects"
                component={ProjectsScreen}
                options={{ title: '我的项目' }}
              />
              <Stack.Screen
                name="TaskList"
                component={TaskListScreen}
                options={({ route }) => ({ title: route.params.projectName })}
              />
              <Stack.Screen
                name="TaskDetail"
                component={TaskDetailScreen}
                options={{ title: '任务详情' }}
              />
              <Stack.Screen
                name="QuickAdd"
                component={QuickAddScreen}
                options={{ title: '快速添加任务', presentation: 'modal' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
