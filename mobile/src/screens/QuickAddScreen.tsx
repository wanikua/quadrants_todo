import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  List,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Analyze and predict
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert('请输入任务描述');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Split text into tasks
      const taskTexts = splitTaskText(inputText);

      if (taskTexts.length === 0) {
        alert('未识别到有效任务');
        return;
      }

      // Call AI to predict priorities
      const predicted = await api.predictTaskPriorities(taskTexts, projectId);

      setPredictions(predicted);
    } catch (error) {
      alert('AI预测失败: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Create tasks
  const handleCreateAll = async () => {
    if (predictions.length === 0) return;

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
      alert('创建失败: ' + (error as Error).message);
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
      <ScrollView style={styles.scrollView}>
        {/* Input Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📝 批量输入任务
          </Text>
          <Text variant="bodySmall" style={styles.hint}>
            每行一个任务，或用逗号、句号分隔
          </Text>
          <Text variant="bodySmall" style={styles.hint}>
            支持 @mention 分配成员（例如：@alice 完成报告）
          </Text>
          <TextInput
            mode="outlined"
            placeholder="例如：&#10;完成项目报告&#10;修复登录bug&#10;@bob 设计新界面"
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={6}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleAnalyze}
            loading={isAnalyzing}
            disabled={isAnalyzing || !inputText.trim()}
            style={styles.button}
          >
            {isAnalyzing ? 'AI分析中...' : '🤖 智能分析'}
          </Button>
        </View>

        {/* Predictions Section */}
        {predictions.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ✨ AI预测结果 ({predictions.length} 个任务)
            </Text>
            <Text variant="bodySmall" style={styles.hint}>
              点击任务可手动调整优先级
            </Text>

            {predictions.map((task, index) => {
              const quadrant = getQuadrantLabel(task.urgency, task.importance);
              return (
                <View key={index}>
                  <List.Item
                    title={task.description}
                    description={
                      <View style={styles.taskInfo}>
                        <Chip mode="flat" style={styles.chip}>
                          {quadrant}
                        </Chip>
                        <Text variant="bodySmall">
                          紧急度: {task.urgency} | 重要度: {task.importance}
                        </Text>
                        {task.reasoning && (
                          <Text variant="bodySmall" style={styles.reasoning}>
                            💡 {task.reasoning}
                          </Text>
                        )}
                      </View>
                    }
                    right={(props) => (
                      <IconButton
                        {...props}
                        icon="close"
                        size={20}
                        onPress={() => handleRemovePrediction(index)}
                      />
                    )}
                  />
                  <Divider />
                </View>
              );
            })}

            <Button
              mode="contained"
              onPress={handleCreateAll}
              loading={isCreating}
              disabled={isCreating}
              style={[styles.button, styles.createButton]}
              icon="check-all"
            >
              {isCreating ? '创建中...' : `创建 ${predictions.length} 个任务`}
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  hint: {
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
  },
  createButton: {
    marginTop: 16,
    backgroundColor: '#10b981',
  },
  taskInfo: {
    marginTop: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  reasoning: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#6b7280',
  },
});
