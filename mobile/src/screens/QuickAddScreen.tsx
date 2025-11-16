import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import {
  api,
  splitTaskText,
  parseMentions,
  TaskPrediction,
  getQuadrantLabel,
} from '@quadrants/shared';
import type { RootStackParamList } from '../../App';

type RouteParams = RouteProp<RootStackParamList, 'QuickAdd'>;

export default function QuickAddScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { projectId } = route.params;
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState('');
  const [predictions, setPredictions] = useState<TaskPrediction[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Analyze and predict
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert('Please enter task description');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Split text into tasks
      const taskTexts = splitTaskText(inputText);

      if (taskTexts.length === 0) {
        alert('No valid tasks detected');
        return;
      }

      // Call AI to predict priorities
      const predicted = await api.predictTaskPriorities(taskTexts, projectId);

      setPredictions(predicted);
    } catch (error) {
      alert('AI prediction failed: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Create tasks
  const handleCreateAll = async () => {
    if (!predictions || predictions.length === 0) return;

    setIsCreating(true);
    try {
      // Create all tasks in parallel
      await Promise.all(
        predictions.map((task) =>
          api.createTask(
            projectId,
            task.description,
            task.urgency,
            task.importance,
            task.assigneeIds
          )
        )
      );

      // Refresh task list
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      // Close modal
      navigation.goBack();
    } catch (error) {
      alert('Create failed: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  // Update single prediction
  const handleUpdatePrediction = (index: number, field: 'urgency' | 'importance', value: number) => {
    const updated = [...predictions];
    updated[index] = { ...updated[index], [field]: value };
    setPredictions(updated);
  };

  // Remove prediction
  const handleRemovePrediction = (index: number) => {
    setPredictions(predictions.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Input Section - Loop minimal style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Batch Input Tasks</Text>
          <Text style={styles.hint}>
            One task per line, or separated by commas or periods
          </Text>
          <Text style={styles.hint}>
            Supports @mention to assign members (e.g., @alice Complete report)
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example:&#10;Complete project report&#10;Fix login bug&#10;@bob Design new interface"
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!inputText.trim() || isAnalyzing) && styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            activeOpacity={0.8}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.analyzeButtonText}>🤖 Smart Analysis</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Predictions Section - Loop minimal style */}
        {predictions?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              AI Predictions ({predictions.length} tasks)
            </Text>
            <Text style={styles.hint}>Tap tasks to manually adjust priority</Text>

            <View style={styles.predictionList}>
              {predictions.map((task, index) => {
                const quadrant = getQuadrantLabel(task.urgency, task.importance);
                const isExpanded = expandedIndex === index;

                return (
                  <View key={index} style={styles.predictionItem}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.predictionHeader,
                        pressed && styles.predictionHeaderPressed,
                      ]}
                      onPress={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      <View style={styles.predictionHeaderLeft}>
                        <Text style={styles.predictionTitle} numberOfLines={2}>
                          {task.description}
                        </Text>
                        <View style={styles.predictionMeta}>
                          <Text style={styles.metaTag}>{quadrant}</Text>
                          <Text style={styles.metaSeparator}>•</Text>
                          <Text style={styles.metaText}>
                            U:{task.urgency} I:{task.importance}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.predictionHeaderRight}>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemovePrediction(index)}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                        <Text style={styles.expandIcon}>
                          {isExpanded ? '▲' : '▼'}
                        </Text>
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.sliderContainer}>
                        <View style={styles.sliderGroup}>
                          <Text style={styles.sliderLabel}>
                            Urgency: {Math.round(task.urgency)}
                          </Text>
                          <Slider
                            value={task.urgency}
                            onValueChange={(value) =>
                              handleUpdatePrediction(index, 'urgency', value)
                            }
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                            minimumTrackTintColor="#ef4444"
                            maximumTrackTintColor="#e5e7eb"
                            thumbTintColor="#ef4444"
                          />
                        </View>

                        <View style={styles.sliderGroup}>
                          <Text style={styles.sliderLabel}>
                            Importance: {Math.round(task.importance)}
                          </Text>
                          <Slider
                            value={task.importance}
                            onValueChange={(value) =>
                              handleUpdatePrediction(index, 'importance', value)
                            }
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                            minimumTrackTintColor="#f59e0b"
                            maximumTrackTintColor="#e5e7eb"
                            thumbTintColor="#f59e0b"
                          />
                        </View>

                        {task.reasoning && (
                          <Text style={styles.reasoning}>💡 {task.reasoning}</Text>
                        )}
                      </View>
                    )}

                    {index < predictions.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                isCreating && styles.createButtonDisabled,
              ]}
              onPress={handleCreateAll}
              disabled={isCreating}
              activeOpacity={0.8}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>
                  Create {predictions.length} Tasks
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Loop-inspired minimal styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  // Input
  input: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    minHeight: 120,
  },
  // Analyze button
  analyzeButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  // Prediction list
  predictionList: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  predictionItem: {
    backgroundColor: '#ffffff',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  predictionHeaderPressed: {
    backgroundColor: '#f9fafb',
  },
  predictionHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  predictionTitle: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  predictionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTag: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  predictionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '300',
  },
  expandIcon: {
    fontSize: 10,
    color: '#9ca3af',
  },
  // Sliders
  sliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
  },
  sliderGroup: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  reasoning: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  // Create button
  createButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
