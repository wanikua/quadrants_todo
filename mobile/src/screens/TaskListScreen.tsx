import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  RefreshControl,
  Text,
  TouchableOpacity,
  Pressable
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import {
  api,
  TaskWithAssignees,
  sortTasksByPriority,
  getQuadrantLabel,
  getQuadrantColor,
  calculatePriorityScore,
} from '@quadrants/shared';
import type { RootStackParamList } from '../../App';
import LoadingView from '../components/LoadingView';
import ErrorView from '../components/ErrorView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskList'>;
type RouteParams = RouteProp<RootStackParamList, 'TaskList'>;

export default function TaskListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { projectId, projectName } = route.params;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch project data
  const { data, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.syncProjectData(projectId),
    refetchInterval: 3000, // Real-time sync every 3 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    setRefreshing(false);
  };

  // Set up real-time activity
  useEffect(() => {
    const interval = setInterval(() => {
      api.updateUserActivity(projectId).catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  if (isLoading) {
    return <LoadingView message="Loading task list..." />;
  }

  if (error) {
    return <ErrorView error={error as Error} onRetry={handleRefresh} />;
  }

  const tasks = data?.tasks || [];
  const sortedTasks = sortTasksByPriority(tasks);

  // Loop-style color mapping (subtle, minimal)
  const getQuadrantDotColor = (urgency: number, importance: number) => {
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
      alert('Delete failed: ' + (error as Error).message);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.completeTask(taskId);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (error) {
      alert('Complete failed: ' + (error as Error).message);
    }
  };

  // Render right swipe actions (delete, complete) - Loop minimal style
  const renderRightActions = (
    taskId: number,
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.completeAction]}
          onPress={() => handleCompleteTask(taskId)}
        >
          <Text style={styles.swipeActionText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDeleteTask(taskId)}
        >
          <Text style={styles.swipeActionText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Online users indicator - Loop minimal style */}
      {data?.activeUsers && data.activeUsers > 1 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>🟢 {data.activeUsers} online</Text>
        </View>
      )}

      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item, index }) => {
          const quadrant = getQuadrantLabel(item.urgency, item.importance);
          const dotColor = getQuadrantDotColor(item.urgency, item.importance);
          const priorityScore = calculatePriorityScore(item.urgency, item.importance);

          return (
            <Swipeable
              renderRightActions={(progress, dragX) =>
                renderRightActions(item.id, progress, dragX)
              }
              overshootRight={false}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.listItem,
                  pressed && styles.listItemPressed,
                  index !== sortedTasks.length - 1 && styles.listItemBorder,
                ]}
                onPress={() =>
                  navigation.navigate('TaskDetail', {
                    taskId: item.id,
                    projectId,
                  })
                }
              >
                {/* Left: Task info */}
                <View style={styles.taskLeft}>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <View style={styles.taskMeta}>
                    {/* Quadrant dot */}
                    <View
                      style={[styles.quadrantDot, { backgroundColor: dotColor }]}
                    />
                    <Text style={styles.metaText}>
                      {quadrant}
                    </Text>
                    {item.assignees && item.assignees.length > 0 && (
                      <>
                        <Text style={styles.metaSeparator}>•</Text>
                        <View style={styles.assignees}>
                          {item.assignees.map((player, idx) => (
                            <View
                              key={player.id}
                              style={[
                                styles.avatar,
                                { backgroundColor: player.color },
                                idx > 0 && styles.avatarOverlap,
                              ]}
                            >
                              <Text style={styles.avatarText}>
                                {player.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                </View>

                {/* Right: Priority score */}
                <View style={styles.taskRight}>
                  <Text style={styles.priorityScore}>
                    {priorityScore.toFixed(0)}
                  </Text>
                  <Text style={styles.priorityLabel}>priority</Text>
                </View>
              </Pressable>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>
              Click "Quick Add" to get started
            </Text>
          </View>
        }
      />

      {/* FAB - Loop minimal style */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('QuickAdd', { projectId })}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>⚡ Quick Add</Text>
      </TouchableOpacity>
    </View>
  );
}

// Loop-inspired minimal styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  syncBanner: {
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  syncText: {
    fontSize: 12,
    color: '#6b7280',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#d1d5db',
  },
  // List item - Loop minimal style
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    minHeight: 64,
  },
  listItemPressed: {
    backgroundColor: '#f9fafb',
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  // Left side
  taskLeft: {
    flex: 1,
    marginRight: 16,
  },
  taskTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  quadrantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  assignees: {
    flexDirection: 'row',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Right side
  taskRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  priorityScore: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  priorityLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Swipe actions
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
  },
  completeAction: {
    backgroundColor: '#10b981',
  },
  deleteAction: {
    backgroundColor: '#ef4444',
  },
  swipeActionText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
  },
  // FAB - Loop minimal style
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
