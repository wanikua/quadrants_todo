'use client';

/**
 * React hook for offline-first data management
 * Provides tasks, players, lines with automatic caching and sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSyncService, SyncStatus } from './sync';
import { LocalTask, LocalPlayer, LocalLine, getTasksByProject, getPlayersByProject, getLinesByProject } from './db';

interface UseOfflineDataOptions {
  projectId: string;
  initialTasks?: LocalTask[];
  initialPlayers?: LocalPlayer[];
  initialLines?: LocalLine[];
  onTasksChange?: (tasks: LocalTask[]) => void;
}

interface UseOfflineDataReturn {
  tasks: LocalTask[];
  players: LocalPlayer[];
  lines: LocalLine[];
  syncStatus: SyncStatus;
  isLoading: boolean;
  createTask: (description: string, urgency: number, importance: number, assigneeIds: number[]) => Promise<LocalTask>;
  updateTask: (taskId: number, updates: { description?: string; urgency?: number; importance?: number; assigneeIds?: number[] }) => Promise<void>;
  completeTask: (taskId: number) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  refreshFromServer: () => Promise<void>;
  forceSync: () => Promise<void>;
}

export function useOfflineData({
  projectId,
  initialTasks = [],
  initialPlayers = [],
  initialLines = [],
  onTasksChange,
}: UseOfflineDataOptions): UseOfflineDataReturn {
  const [tasks, setTasks] = useState<LocalTask[]>(initialTasks);
  const [players, setPlayers] = useState<LocalPlayer[]>(initialPlayers);
  const [lines, setLines] = useState<LocalLine[]>(initialLines);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const syncService = useRef(getSyncService());
  const hasInitialized = useRef(false);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncService.current.subscribe((status) => {
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, []);

  // Initialize: load cached data and cache initial data
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialize = async () => {
      setIsLoading(true);
      try {
        // If we have initial data from server, cache it
        if (initialTasks.length > 0 || initialPlayers.length > 0) {
          // Data is already in the correct format from server
          // The sync service will handle caching
        }

        // Try to load any cached data first
        const cachedTasks = await getTasksByProject(projectId);
        const cachedPlayers = await getPlayersByProject(projectId);
        const cachedLines = await getLinesByProject(projectId);

        // Merge server data with any unsynced local data
        if (cachedTasks.length > 0) {
          const unsyncedTasks = cachedTasks.filter(t => !t.synced);
          const serverTaskIds = new Set(initialTasks.map(t => t.id));

          // Keep unsynced tasks that don't exist on server
          const mergedTasks = [
            ...initialTasks,
            ...unsyncedTasks.filter(t => !serverTaskIds.has(t.id)),
          ];

          setTasks(mergedTasks);
        } else {
          setTasks(initialTasks);
        }

        if (cachedPlayers.length > 0) {
          setPlayers(cachedPlayers);
        } else {
          setPlayers(initialPlayers);
        }

        if (cachedLines.length > 0) {
          setLines(cachedLines);
        } else {
          setLines(initialLines);
        }
      } catch (error) {
        console.error('Failed to initialize offline data:', error);
        // Fall back to initial data
        setTasks(initialTasks);
        setPlayers(initialPlayers);
        setLines(initialLines);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [projectId, initialTasks, initialPlayers, initialLines]);

  // Notify parent of task changes
  useEffect(() => {
    if (onTasksChange) {
      onTasksChange(tasks);
    }
  }, [tasks, onTasksChange]);

  // Create a new task
  const createTask = useCallback(async (
    description: string,
    urgency: number,
    importance: number,
    assigneeIds: number[]
  ): Promise<LocalTask> => {
    const newTask = await syncService.current.createTask(
      projectId,
      description,
      urgency,
      importance,
      assigneeIds
    );

    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, [projectId]);

  // Update a task
  const updateTask = useCallback(async (
    taskId: number,
    updates: { description?: string; urgency?: number; importance?: number; assigneeIds?: number[] }
  ): Promise<void> => {
    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? {
            ...task,
            ...updates,
            assignee_ids: updates.assigneeIds || task.assignee_ids,
            updated_at: new Date().toISOString(),
            synced: false,
          }
        : task
    ));

    await syncService.current.updateTask(taskId, projectId, updates);
  }, [projectId]);

  // Complete a task
  const completeTask = useCallback(async (taskId: number): Promise<void> => {
    // Optimistic update - remove from visible tasks
    setTasks(prev => prev.filter(task => task.id !== taskId));

    await syncService.current.completeTask(taskId, projectId);
  }, [projectId]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: number): Promise<void> => {
    // Optimistic update - remove from visible tasks
    setTasks(prev => prev.filter(task => task.id !== taskId));

    await syncService.current.deleteTask(taskId, projectId);
  }, [projectId]);

  // Refresh data from server
  const refreshFromServer = useCallback(async (): Promise<void> => {
    if (!syncStatus.isOnline) {
      console.log('Cannot refresh while offline');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch fresh data from server via API
      const response = await fetch(`/api/projects/${projectId}/sync`);
      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          const { tasks: serverTasks, players: serverPlayers, lines: serverLines, project } = result.data;

          // Update local state
          const localTasks = serverTasks.map((t: Parameters<typeof syncService.current.taskToLocal>[0]) =>
            syncService.current.taskToLocal(t, projectId)
          );
          const localPlayers = serverPlayers.map((p: Parameters<typeof syncService.current.playerToLocal>[0]) =>
            syncService.current.playerToLocal(p, projectId)
          );
          const localLines = serverLines.map((l: Parameters<typeof syncService.current.lineToLocal>[0]) =>
            syncService.current.lineToLocal(l, projectId)
          );

          setTasks(localTasks);
          setPlayers(localPlayers);
          setLines(localLines);

          // Cache the fresh data
          if (project) {
            await syncService.current.cacheProjectData(
              projectId,
              project,
              serverTasks,
              serverPlayers,
              serverLines
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh from server:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, syncStatus.isOnline]);

  // Force sync pending operations
  const forceSync = useCallback(async (): Promise<void> => {
    await syncService.current.forceSync(projectId);
  }, [projectId]);

  return {
    tasks,
    players,
    lines,
    syncStatus,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    refreshFromServer,
    forceSync,
  };
}
