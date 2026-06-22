'use client';

/**
 * Local-only mode for desktop app
 * No authentication required - uses IndexedDB for local storage
 */

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import QuadrantMatrixMap from '@/components/QuadrantMatrixMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  openDatabase,
  getAll,
  put,
  remove,
} from '@/app/lib/offline/db';
import type { TaskWithAssignees, Player } from '@/app/types';

interface LocalTask {
  id: number;
  description: string;
  urgency: number;
  importance: number;
  created_at: string;
  updated_at: string;
  project_id: string;
  assignees: { id: number; name: string; color: string }[];
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

export default function LocalModePage() {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskUrgency, setNewTaskUrgency] = useState(50);
  const [newTaskImportance, setNewTaskImportance] = useState(50);
  const [selectedTask, setSelectedTask] = useState<LocalTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Initialize database and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await openDatabase();

        // Load tasks from IndexedDB
        const storedTasks = await getAll<LocalTask>('tasks');
        const activeTasks = storedTasks.filter((t: any) => !t.deleted && !t.archived);
        setTasks(activeTasks);

        // Load players from IndexedDB
        const storedPlayers = await getAll<Player>('players');
        if (storedPlayers.length === 0) {
          // Create default player
          const defaultPlayer: Player = {
            id: 1,
            name: 'Me',
            color: DEFAULT_COLORS[0],
          };
          await put('players', defaultPlayer);
          setPlayers([defaultPlayer]);
        } else {
          setPlayers(storedPlayers);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Add new task
  const handleAddTask = async () => {
    if (!newTaskDescription.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    const now = new Date().toISOString();
    const newTask: LocalTask = {
      id: Date.now(),
      description: newTaskDescription.trim(),
      urgency: newTaskUrgency,
      importance: newTaskImportance,
      created_at: now,
      updated_at: now,
      project_id: 'local',
      assignees: [],
    };

    try {
      await put('tasks', { ...newTask, synced: true, deleted: false, archived: false, assignee_ids: [] });
      setTasks(prev => [...prev, newTask]);
      setNewTaskDescription('');
      setNewTaskUrgency(50);
      setNewTaskImportance(50);
      setIsAddTaskOpen(false);
      toast.success('Task added');
    } catch (error) {
      console.error('Failed to add task:', error);
      toast.error('Failed to add task');
    }
  };

  // Update task position (drag and drop)
  const handleUpdateTask = useCallback(async (
    taskId: number,
    updates: { urgency?: number; importance?: number; description?: string }
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      await put('tasks', { ...updatedTask, synced: true, deleted: false, archived: false, assignee_ids: [] });
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  }, [tasks]);

  // Complete (archive) task
  const handleCompleteTask = useCallback(async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await put('tasks', { ...task, synced: true, deleted: false, archived: true, assignee_ids: [] });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setIsTaskDetailOpen(false);
      setSelectedTask(null);
      toast.success('Task completed');
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    }
  }, [tasks]);

  // Delete task
  const handleDeleteTask = useCallback(async (taskId: number) => {
    try {
      await remove('tasks', taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setIsTaskDetailOpen(false);
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  }, []);

  // Handle task click
  const handleTaskDetailClick = useCallback((task: TaskWithAssignees) => {
    const localTask = tasks.find(t => t.id === task.id);
    if (localTask) {
      setSelectedTask(localTask);
      setIsTaskDetailOpen(true);
    }
  }, [tasks]);

  // Handle long press to add task at position
  const handleLongPress = useCallback((urgency: number, importance: number) => {
    setNewTaskUrgency(urgency);
    setNewTaskImportance(importance);
    setIsAddTaskOpen(true);
  }, []);

  // Convert LocalTask to TaskWithAssignees for the component
  const tasksForMap: TaskWithAssignees[] = tasks.map(t => ({
    id: t.id,
    description: t.description,
    urgency: t.urgency,
    importance: t.importance,
    created_at: new Date(t.created_at),
    updated_at: new Date(t.updated_at),
    project_id: t.project_id,
    assignees: t.assignees || [],
  }));

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b-3 border-black px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm">
            <Image
              src="/logo.png"
              alt="Quadrants"
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-lg"
            />
          </div>
          <h1 className="text-lg font-black text-black">My Tasks</h1>
          <span className="bg-yellow-100 text-black border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-bold">
            Local Mode
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{tasks.length} tasks</span>
          <Button
            onClick={() => setIsAddTaskOpen(true)}
            size="sm"
            className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow rounded-xl font-bold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        </div>
      </header>

      {/* Main Content - Quadrant Matrix */}
      <div className="flex-1 overflow-hidden">
        <QuadrantMatrixMap
          tasks={tasksForMap}
          players={players}
          lines={[]}
          projectId="local"
          isMobile={false}
          onTaskDetailClick={handleTaskDetailClick}
          onLongPress={handleLongPress}
          projectType="personal"
          setTasks={(updater) => {
            const updated = updater(tasksForMap);
            // Find which task changed and update it
            updated.forEach(t => {
              const original = tasksForMap.find(o => o.id === t.id);
              if (original && (original.urgency !== t.urgency || original.importance !== t.importance)) {
                handleUpdateTask(t.id, { urgency: t.urgency, importance: t.importance });
              }
            });
          }}
        />
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Description</label>
              <Input
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="What needs to be done?"
                className="mt-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700">
                  Urgency: {newTaskUrgency}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newTaskUrgency}
                  onChange={(e) => setNewTaskUrgency(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">
                  Importance: {newTaskImportance}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newTaskImportance}
                  onChange={(e) => setNewTaskImportance(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddTask}
                className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow rounded-xl font-bold"
              >
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Description</label>
                <Input
                  value={selectedTask.description}
                  onChange={(e) => {
                    const newDesc = e.target.value;
                    setSelectedTask({ ...selectedTask, description: newDesc });
                  }}
                  onBlur={() => {
                    handleUpdateTask(selectedTask.id, { description: selectedTask.description });
                  }}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">
                    Urgency: {selectedTask.urgency}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedTask.urgency}
                    onChange={(e) => {
                      const newUrgency = Number(e.target.value);
                      setSelectedTask({ ...selectedTask, urgency: newUrgency });
                    }}
                    onMouseUp={() => {
                      handleUpdateTask(selectedTask.id, { urgency: selectedTask.urgency });
                    }}
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">
                    Importance: {selectedTask.importance}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedTask.importance}
                    onChange={(e) => {
                      const newImportance = Number(e.target.value);
                      setSelectedTask({ ...selectedTask, importance: newImportance });
                    }}
                    onMouseUp={() => {
                      handleUpdateTask(selectedTask.id, { importance: selectedTask.importance });
                    }}
                    className="w-full mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                <Button
                  onClick={() => handleCompleteTask(selectedTask.id)}
                  className="bg-green-600 hover:bg-green-700 border-2 border-black rounded-xl font-bold text-white"
                >
                  Mark Complete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
