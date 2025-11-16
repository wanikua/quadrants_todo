import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
import LoadingView from '../components/LoadingView';

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
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Load project data to find the task
  const { data, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.syncProjectData(projectId),
  });

  // Initialize form values when task data changes (but not while editing)
  useEffect(() => {
    if (data && !editMode) {
      const task = data.tasks.find((t) => t.id === taskId);
      if (task) {
        setDescription(task.description);
        setUrgency(task.urgency);
        setImportance(task.importance);
      }
    }
  }, [data, taskId, editMode]);

  if (isLoading) {
    return <LoadingView message="Loading task details..." />;
  }

  const task = data?.tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Task not found</Text>
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
      Alert.alert('Error', 'Save failed: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteTask(taskId);
              queryClient.invalidateQueries({ queryKey: ['project', projectId] });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Delete failed: ' + (error as Error).message);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    try {
      await api.completeTask(taskId);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Complete failed: ' + (error as Error).message);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentAuthor.trim()) {
      Alert.alert('Error', 'Please enter comment content and author name');
      return;
    }

    setIsAddingComment(true);
    try {
      await api.addComment(taskId, commentText.trim(), commentAuthor.trim());
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      // Clear form
      setCommentText('');
      // Keep author name for next comment
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment: ' + (error as Error).message);
    } finally {
      setIsAddingComment(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Task Info - Loop minimal style */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.quadrantLabel}>{quadrant}</Text>
          <Text style={styles.timeText}>
            {formatRelativeTime(task.created_at!)}
          </Text>
        </View>

        {editMode ? (
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Task description"
            placeholderTextColor="#9ca3af"
          />
        ) : (
          <Text style={styles.descriptionText}>{task.description}</Text>
        )}
      </View>

      <View style={styles.divider} />

      {/* Priority Sliders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Settings</Text>

        <View style={styles.sliderGroup}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Urgency</Text>
            <Text style={styles.sliderValue}>
              {Math.round(editMode ? urgency : task.urgency)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            value={editMode ? urgency : task.urgency}
            onValueChange={setUrgency}
            minimumValue={0}
            maximumValue={100}
            step={5}
            disabled={!editMode}
            minimumTrackTintColor="#ef4444"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={editMode ? '#ef4444' : '#d1d5db'}
          />
        </View>

        <View style={styles.sliderGroup}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Importance</Text>
            <Text style={styles.sliderValue}>
              {Math.round(editMode ? importance : task.importance)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            value={editMode ? importance : task.importance}
            onValueChange={setImportance}
            minimumValue={0}
            maximumValue={100}
            step={5}
            disabled={!editMode}
            minimumTrackTintColor="#f59e0b"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={editMode ? '#f59e0b' : '#d1d5db'}
          />
        </View>
      </View>

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned To</Text>
            <View style={styles.assigneesList}>
              {task.assignees.map((player) => (
                <View key={player.id} style={styles.assigneeItem}>
                  <View
                    style={[styles.assigneeAvatar, { backgroundColor: player.color }]}
                  >
                    <Text style={styles.assigneeAvatarText}>
                      {player.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.assigneeName}>{player.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Comments */}
      <View style={styles.divider} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Comments ({task.comments?.length || 0})
        </Text>

        {/* Existing comments */}
        {task.comments && task.comments.length > 0 && (
          <View style={styles.commentsList}>
            {task.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                  <Text style={styles.commentTime}>
                    {formatRelativeTime(comment.created_at!)}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Add comment form */}
        <View style={styles.commentForm}>
          <TextInput
            style={styles.commentNameInput}
            value={commentAuthor}
            onChangeText={setCommentAuthor}
            placeholder="Your name"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={styles.commentTextInput}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            numberOfLines={3}
            placeholder="Share your thoughts..."
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || !commentAuthor.trim() || isAddingComment) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={isAddingComment || !commentText.trim() || !commentAuthor.trim()}
            activeOpacity={0.8}
          >
            {isAddingComment ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Comment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.divider} />
      <View style={styles.section}>
        {editMode ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setEditMode(false);
                setDescription(task.description);
                setUrgency(task.urgency);
                setImportance(task.importance);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setEditMode(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Edit Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>✓ Complete Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>Delete Task</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Loop-inspired minimal styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  section: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quadrantLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  descriptionText: {
    fontSize: 20,
    color: '#111827',
    lineHeight: 28,
  },
  descriptionInput: {
    fontSize: 18,
    color: '#111827',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Section title
  sectionTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 16,
  },
  // Sliders
  sliderGroup: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 14,
    color: '#6b7280',
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  // Assignees
  assigneesList: {
    gap: 12,
  },
  assigneeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  assigneeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assigneeAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  assigneeName: {
    fontSize: 15,
    color: '#111827',
  },
  // Comments
  commentsList: {
    marginBottom: 16,
  },
  comment: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  commentTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  commentContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  // Comment form
  commentForm: {
    marginTop: 12,
  },
  commentNameInput: {
    fontSize: 14,
    color: '#111827',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
  },
  commentTextInput: {
    fontSize: 14,
    color: '#111827',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    minHeight: 80,
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Action buttons
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#111827',
  },
  saveButton: {
    backgroundColor: '#111827',
  },
  completeButton: {
    backgroundColor: '#10b981',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
  },
});
