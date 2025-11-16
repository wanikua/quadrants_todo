import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Dialog,
  Portal,
  TextInput,
  Button,
  RadioButton,
  Text,
} from 'react-native-paper';
import { api } from '@quadrants/shared';

interface CreateProjectDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function CreateProjectDialog({
  visible,
  onDismiss,
  onSuccess,
}: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'personal' | 'team'>('personal');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter project name');
      return;
    }

    setIsCreating(true);
    try {
      await api.createProject(name.trim(), type, description.trim() || undefined);

      // Reset form
      setName('');
      setDescription('');
      setType('personal');

      onSuccess();
      onDismiss();
    } catch (error) {
      alert('Create failed: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Create New Project</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Project Name *"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="e.g., Quarterly Goals"
          />
          <TextInput
            mode="outlined"
            label="Project Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            style={styles.input}
            placeholder="Describe the project's purpose and goals"
          />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Project Type
          </Text>
          <RadioButton.Group onValueChange={(value) => setType(value as 'personal' | 'team')} value={type}>
            <View style={styles.radioItem}>
              <RadioButton value="personal" />
              <View style={styles.radioLabel}>
                <Text variant="bodyLarge">Personal Project</Text>
                <Text variant="bodySmall" style={styles.radioDescription}>
                  Only you can view and manage
                </Text>
              </View>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="team" />
              <View style={styles.radioLabel}>
                <Text variant="bodyLarge">Team Project</Text>
                <Text variant="bodySmall" style={styles.radioDescription}>
                  Invite members to collaborate, real-time sync
                </Text>
              </View>
            </View>
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onPress={handleCreate}
            loading={isCreating}
            disabled={isCreating || !name.trim()}
            mode="contained"
          >
            Create
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioDescription: {
    color: '#6b7280',
    marginTop: 2,
  },
});
