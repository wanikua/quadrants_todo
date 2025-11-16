import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import ProjectsScreen from '../screens/ProjectsScreen';
import TaskListScreen from '../screens/TaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import QuickAddScreen from '../screens/QuickAddScreen';

import type { RootStackParamList } from '../../App';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AuthenticatedApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Projects">
        <Stack.Screen
          name="Projects"
          component={ProjectsScreen}
          options={{ title: 'My Projects' }}
        />
        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={({ route }) => ({ title: route.params.projectName })}
        />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{ title: 'Task Details' }}
        />
        <Stack.Screen
          name="QuickAdd"
          component={QuickAddScreen}
          options={{ title: 'Quick Add Tasks', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
