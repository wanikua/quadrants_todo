import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Chip,
  Divider,
  List,
  IconButton,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import {
  api,
  getQuadrantLabel,
  formatRelativeTime,
} from '@quadrants/shared';
import type { RootStackParamList } from '../../App';

type RouteParams = RouteProp<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { taskId, projectId } = route.params;
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState(50);
  const [importance, setImportance] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  // Load project data to find the task
  const { data, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.syncProjectData(projectId),
    onSuccess: (data) => {
      const task = data.tasks.find((t) => t.id === taskId);
      if (task && !editMode) {
        setDescription(task.description);
        setUrgency(task.urgency);
        setImportance(task.importance);
      }
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const task = data?.tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text>任务未找到</Text>
      </View>
    );
  }

  const quadrant = getQuadrantLabel(task.urgency, task.importance);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateTask(taskId, {
        description,
        urgency,
        importance,
      });

      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setEditMode(false);
    } catch (error) {
      alert('保存失败: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTask(taskId);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      navigation.goBack();
    } catch (error) {
      alert('删除失败: ' + (error as Error).message);
    }
  };

  const handleComplete = async () => {
    try {
      await api.completeTask(taskId);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      navigation.goBack();
    } catch (error) {
      alert('完成失败: ' + (error as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Task Info */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Chip mode="flat" style={styles.chip}>
            {quadrant}
          </Chip>
          <Text variant="bodySmall" style={styles.time}>
            创建于 {formatRelativeTime(task.created_at!)}
          </Text>
        </View>

        {editMode ? (
          <TextInput
            mode="outlined"
            label="任务描述"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        ) : (
          <Text variant="headlineSmall" style={styles.description}>
            {task.description}
          </Text>
        )}
      </View>

      <Divider />

      {/* Priority Sliders */}
      <View style={styles.section}>
        <Text variant="titleMedium">优先级设置</Text>

        <View style={styles.sliderGroup}>
          <Text variant="bodyMedium">
            紧急度: {Math.round(editMode ? urgency : task.urgency)}
          </Text>
          <Slider
            value={editMode ? urgency : task.urgency}
            onValueChange={setUrgency}
            minimumValue={0}
            maximumValue={100}
            step={5}
            disabled={!editMode}
            minimumTrackTintColor="#ef4444"
            maximumTrackTintColor="#d1d5db"
          />
        </View>

        <View style={styles.sliderGroup}>
          <Text variant="bodyMedium">
            重要度: {Math.round(editMode ? importance : task.importance)}
          </Text>
          <Slider
            value={editMode ? importance : task.importance}
            onValueChange={setImportance}
            minimumValue={0}
            maximumValue={100}
            step={5}
            disabled={!editMode}
            minimumTrackTintColor="#f59e0b"
            maximumTrackTintColor="#d1d5db"
          />
        </View>
      </View>

      <Divider />

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              分配给
            </Text>
            {task.assignees.map((player) => (
              <List.Item
                key={player.id}
                title={player.name}
                left={(props) => (
                  <View
                    {...props}
                    style={[styles.avatar, { backgroundColor: player.color }]}
                  >
                    <Text style={styles.avatarText}>
                      {player.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              />
            ))}
          </View>
          <Divider />
        </>
      )}

      {/* Comments */}
      {task.comments && task.comments.length > 0 && (
        <>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              评论 ({task.comments.length})
            </Text>
            {task.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text variant="labelMedium">{comment.author_name}</Text>
                <Text variant="bodyMedium" style={styles.commentContent}>
                  {comment.content}
                </Text>
                <Text variant="bodySmall" style={styles.commentTime}>
                  {formatRelativeTime(comment.created_at!)}
                </Text>
              </View>
            ))}
          </View>
          <Divider />
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        {editMode ? (
          <>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              style={styles.button}
            >
              保存修改
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setEditMode(false);
                setDescription(task.description);
                setUrgency(task.urgency);
                setImportance(task.importance);
              }}
              style={styles.button}
            >
              取消
            </Button>
          </>
        ) : (
          <>
            <Button
              mode="contained"
              onPress={() => setEditMode(true)}
              icon="pencil"
              style={styles.button}
            >
              编辑任务
            </Button>
            <Button
              mode="contained"
              onPress={handleComplete}
              icon="check"
              style={[styles.button, { backgroundColor: '#10b981' }]}
            >
              完成任务
            </Button>
            <Button
              mode="outlined"
              onPress={handleDelete}
              icon="delete"
              style={styles.button}
              textColor="#ef4444"
            >
              删除任务
            </Button>
          </>
        )}
      </View>
    </ScrollView>
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
  section: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  time: {
    color: '#6b7280',
  },
  description: {
    marginBottom: 8,
  },
  input: {
    marginTop: 8,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sliderGroup: {
    marginTop: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comment: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  commentContent: {
    marginTop: 4,
    marginBottom: 4,
  },
  commentTime: {
    color: '#6b7280',
  },
  button: {
    marginBottom: 12,
  },
});
