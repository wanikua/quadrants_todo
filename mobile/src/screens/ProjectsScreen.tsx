import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, Project } from '@quadrants/shared';
import type { RootStackParamList } from '../../App';
import CreateProjectDialog from '../components/CreateProjectDialog';
import LoadingView from '../components/LoadingView';
import ErrorView from '../components/ErrorView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Projects'>;

export default function ProjectsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
    retry: 1,
    retryDelay: 1000,
    staleTime: 10000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    setRefreshing(false);
  };

  // Filter out any duplicate projects (safety check)
  const uniqueProjects = React.useMemo(() => {
    if (!projects) return [];
    const seen = new Set();
    return projects.filter(project => {
      if (seen.has(project.id)) return false;
      seen.add(project.id);
      return true;
    });
  }, [projects]);

  if (isLoading) {
    return <LoadingView message="Loading projects..." />;
  }

  if (error) {
    return <ErrorView error={error as Error} onRetry={handleRefresh} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <Text style={styles.headerSubtitle}>
          {uniqueProjects.length} {uniqueProjects.length === 1 ? 'project' : 'projects'}
        </Text>
      </View>

      <FlatList
        data={uniqueProjects}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [
              styles.projectItem,
              pressed && styles.projectItemPressed,
              index !== uniqueProjects.length - 1 && styles.projectItemBorder,
            ]}
            onPress={() =>
              navigation.navigate('TaskList', {
                projectId: item.id,
                projectName: item.name,
              })
            }
          >
            {/* Left: Project icon and info */}
            <View style={styles.projectLeft}>
              <View
                style={[
                  styles.projectIcon,
                  item.type === 'team' ? styles.projectIconTeam : styles.projectIconPersonal,
                ]}
              >
                <Text style={styles.projectIconText}>
                  {item.type === 'team' ? '👥' : '👤'}
                </Text>
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.projectMeta}>
                  {item.description || (item.type === 'team' ? 'Team Project' : 'Personal Project')}
                </Text>
              </View>
            </View>

            {/* Right: Chevron */}
            <View style={styles.projectRight}>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "New Project" to create your first project
            </Text>
          </View>
        }
        contentContainerStyle={uniqueProjects.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* FAB - Loop minimal style */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateDialog(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ New Project</Text>
      </TouchableOpacity>

      <CreateProjectDialog
        visible={showCreateDialog}
        onDismiss={() => setShowCreateDialog(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
      />
    </View>
  );
}

// Loop-inspired minimal styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Project list item
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    minHeight: 72,
  },
  projectItemPressed: {
    backgroundColor: '#f9fafb',
  },
  projectItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  // Left side
  projectLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectIconPersonal: {
    backgroundColor: '#f3f4f6',
  },
  projectIconTeam: {
    backgroundColor: '#eff6ff',
  },
  projectIconText: {
    fontSize: 20,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  projectMeta: {
    fontSize: 13,
    color: '#9ca3af',
  },
  // Right side
  projectRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 24,
    color: '#d1d5db',
    fontWeight: '300',
  },
  // Empty state
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
  // FAB
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
