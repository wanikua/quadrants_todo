import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  List,
  FAB,
  ActivityIndicator,
  Text,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  api,
  TaskWithAssignees,
  sortTasksByPriority,
  getQuadrantLabel,
  getQuadrantColor,
  calculatePriorityScore,
} from '@quadrants/shared';
import type { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskList'>;
type RouteParams = RouteProp<RootStackParamList, 'TaskList'>;

export default function TaskListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { projectId, projectName } = route.params;
  const queryClient = useQueryClient();

  // Fetch project data
  const { data, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.syncProjectData(projectId),
    refetchInterval: 3000, // Real-time sync every 3 seconds
  });

  // Set up real-time activity
  useEffect(() => {
    const interval = setInterval(() => {
      api.updateUserActivity(projectId).catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

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

  const tasks = data?.tasks || [];
  const sortedTasks = sortTasksByPriority(tasks);

  const getQuadrantChipColor = (urgency: number, importance: number) => {
    const color = getQuadrantColor(urgency, importance);
    switch (color) {
      case 'red': return '#ef4444';
      case 'yellow': return '#f59e0b';
      case 'blue': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (error) {
      alert('删除失败: ' + (error as Error).message);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.completeTask(taskId);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (error) {
      alert('完成失败: ' + (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      {data?.activeUsers && data.activeUsers > 1 && (
        <View style={styles.syncBanner}>
          <Text variant="bodySmall">🟢 {data.activeUsers} 人在线</Text>
        </View>
      )}

      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const quadrant = getQuadrantLabel(item.urgency, item.importance);
          const quadrantColor = getQuadrantChipColor(item.urgency, item.importance);
          const priorityScore = calculatePriorityScore(item.urgency, item.importance);

          return (
            <>
              <List.Item
                title={item.description}
                description={
                  <View style={styles.taskMeta}>
                    <Chip
                      mode="flat"
                      style={[styles.chip, { backgroundColor: quadrantColor + '20' }]}
                      textStyle={{ color: quadrantColor }}
                    >
                      {quadrant}
                    </Chip>
                    <Text variant="bodySmall" style={styles.priority}>
                      优先级: {priorityScore.toFixed(0)}
                    </Text>
                    {item.assignees && item.assignees.length > 0 && (
                      <View style={styles.assignees}>
                        {item.assignees.map((player) => (
                          <View
                            key={player.id}
                            style={[
                              styles.avatar,
                              { backgroundColor: player.color },
                            ]}
                          >
                            <Text style={styles.avatarText}>
                              {player.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                }
                onPress={() =>
                  navigation.navigate('TaskDetail', {
                    taskId: item.id,
                    projectId,
                  })
                }
                right={(props) => (
                  <View style={styles.actions}>
                    <IconButton
                      {...props}
                      icon="check"
                      size={20}
                      onPress={() => handleCompleteTask(item.id)}
                    />
                    <IconButton
                      {...props}
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteTask(item.id)}
                    />
                  </View>
                )}
              />
              <Divider />
            </>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">暂无任务</Text>
            <Text variant="bodyMedium">点击 + 快速添加任务</Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="lightning-bolt"
        label="快速添加"
        onPress={() => navigation.navigate('QuickAdd', { projectId })}
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
  syncBanner: {
    backgroundColor: '#10b981',
    padding: 8,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    marginRight: 8,
    height: 24,
  },
  priority: {
    marginRight: 8,
    color: '#6b7280',
  },
  assignees: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
