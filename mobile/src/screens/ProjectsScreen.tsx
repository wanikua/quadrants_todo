import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  List,
  FAB,
  ActivityIndicator,
  Text,
  Divider,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, Project } from '@quadrants/shared';
import type { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Projects'>;

export default function ProjectsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">加载失败: {(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <>
            <List.Item
              title={item.name}
              description={item.description || item.type === 'team' ? '团队项目' : '个人项目'}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={item.type === 'team' ? 'account-group' : 'account'}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                navigation.navigate('TaskList', {
                  projectId: item.id,
                  projectName: item.name,
                })
              }
            />
            <Divider />
          </>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">暂无项目</Text>
            <Text variant="bodyMedium">点击 + 创建新项目</Text>
          </View>
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        label="新建项目"
        onPress={() => {
          // TODO: Implement create project modal
          alert('创建项目功能即将推出');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
