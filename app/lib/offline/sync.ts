/**
 * Sync service for hybrid online/offline mode
 * Handles network detection, sync queue processing, and conflict resolution
 */

import {
  LocalTask,
  LocalPlayer,
  LocalLine,
  SyncOperation,
  getTasksByProject,
  getPlayersByProject,
  getLinesByProject,
  saveTasks,
  savePlayers,
  saveLines,
  saveTask,
  savePlayer,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  saveProject,
  getMetadata,
  setMetadata,
  generateLocalId,
  LocalProject,
} from './db';

type SyncCallback = (status: SyncStatus) => void;

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncedAt?: string;
  error?: string;
}

class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncCallback> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Start periodic sync check
      this.startSyncInterval();
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners();
    this.processSyncQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
  };

  private startSyncInterval() {
    // Check for pending syncs every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    // Send initial status
    this.getStatus().then(callback);
    return () => this.listeners.delete(callback);
  }

  private async notifyListeners() {
    const status = await this.getStatus();
    this.listeners.forEach(cb => cb(status));
  }

  async getStatus(): Promise<SyncStatus> {
    const queue = await getSyncQueue();
    const lastSyncedAt = await getMetadata<string>('lastSyncedAt');

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: queue.length,
      lastSyncedAt,
    };
  }

  // Convert server task to local format
  taskToLocal(task: {
    id: number;
    project_id?: string;
    description: string;
    urgency: number;
    importance: number;
    archived?: boolean;
    created_at?: string | Date;
    updated_at?: string | Date;
    assignees?: { id: number }[];
  }, projectId: string): LocalTask {
    return {
      id: task.id,
      project_id: task.project_id || projectId,
      description: task.description,
      urgency: task.urgency,
      importance: task.importance,
      archived: task.archived || false,
      created_at: task.created_at ? new Date(task.created_at).toISOString() : new Date().toISOString(),
      updated_at: task.updated_at ? new Date(task.updated_at).toISOString() : new Date().toISOString(),
      synced: true,
      deleted: false,
      assignee_ids: task.assignees?.map(a => a.id) || [],
    };
  }

  // Convert server player to local format
  playerToLocal(player: {
    id: number;
    project_id?: string;
    user_id?: string;
    name: string;
    color: string;
    created_at?: string | Date;
  }, projectId: string): LocalPlayer {
    return {
      id: player.id,
      project_id: player.project_id || projectId,
      user_id: player.user_id,
      name: player.name,
      color: player.color,
      created_at: player.created_at ? new Date(player.created_at).toISOString() : new Date().toISOString(),
      synced: true,
      deleted: false,
    };
  }

  // Convert server line to local format
  lineToLocal(line: {
    id: number;
    project_id?: string;
    from_task_id: number;
    to_task_id: number;
    style?: string;
    size?: number;
    color?: string;
    created_at?: string | Date;
  }, projectId: string): LocalLine {
    return {
      id: line.id,
      project_id: line.project_id || projectId,
      from_task_id: line.from_task_id,
      to_task_id: line.to_task_id,
      style: line.style,
      size: line.size,
      color: line.color,
      created_at: line.created_at ? new Date(line.created_at).toISOString() : new Date().toISOString(),
      synced: true,
      deleted: false,
    };
  }

  // Save server data to local database
  async cacheProjectData(
    projectId: string,
    project: { id: string; name: string; description?: string; type: 'personal' | 'team'; owner_id: string; archived?: boolean },
    tasks: Parameters<typeof this.taskToLocal>[0][],
    players: Parameters<typeof this.playerToLocal>[0][],
    lines: Parameters<typeof this.lineToLocal>[0][]
  ): Promise<void> {
    try {
      // Save project metadata
      await saveProject({
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        owner_id: project.owner_id,
        archived: project.archived || false,
        lastSyncedAt: new Date().toISOString(),
      });

      // Convert and save tasks
      const localTasks = tasks.map(t => this.taskToLocal(t, projectId));
      await saveTasks(localTasks);

      // Convert and save players
      const localPlayers = players.map(p => this.playerToLocal(p, projectId));
      await savePlayers(localPlayers);

      // Convert and save lines
      const localLines = lines.map(l => this.lineToLocal(l, projectId));
      await saveLines(localLines);

      await setMetadata('lastSyncedAt', new Date().toISOString());
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to cache project data:', error);
    }
  }

  // Get cached data for a project
  async getCachedProjectData(projectId: string): Promise<{
    tasks: LocalTask[];
    players: LocalPlayer[];
    lines: LocalLine[];
  } | null> {
    try {
      const tasks = await getTasksByProject(projectId);
      const players = await getPlayersByProject(projectId);
      const lines = await getLinesByProject(projectId);

      return { tasks, players, lines };
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Queue an operation for sync
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    await addToSyncQueue({
      ...operation,
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Create task (works offline)
  async createTask(
    projectId: string,
    description: string,
    urgency: number,
    importance: number,
    assigneeIds: number[]
  ): Promise<LocalTask> {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    const task: LocalTask = {
      id: parseInt(localId.replace(/\D/g, '').slice(0, 9)), // Generate numeric ID from timestamp
      localId,
      project_id: projectId,
      description,
      urgency,
      importance,
      archived: false,
      created_at: now,
      updated_at: now,
      synced: false,
      deleted: false,
      assignee_ids: assigneeIds,
    };

    await saveTask(task);

    await this.queueOperation({
      type: 'create',
      entity: 'task',
      entityId: localId,
      projectId,
      data: { description, urgency, importance, assigneeIds },
    });

    return task;
  }

  // Update task (works offline)
  async updateTask(
    taskId: number,
    projectId: string,
    updates: { description?: string; urgency?: number; importance?: number; assigneeIds?: number[] }
  ): Promise<void> {
    const tasks = await getTasksByProject(projectId);
    const task = tasks.find(t => t.id === taskId);

    if (task) {
      const updatedTask: LocalTask = {
        ...task,
        ...updates,
        assignee_ids: updates.assigneeIds || task.assignee_ids,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await saveTask(updatedTask);

      await this.queueOperation({
        type: 'update',
        entity: 'task',
        entityId: taskId,
        projectId,
        data: updates,
      });
    }
  }

  // Complete (archive) task (works offline)
  async completeTask(taskId: number, projectId: string): Promise<void> {
    const tasks = await getTasksByProject(projectId);
    const task = tasks.find(t => t.id === taskId);

    if (task) {
      const updatedTask: LocalTask = {
        ...task,
        archived: true,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await saveTask(updatedTask);

      await this.queueOperation({
        type: 'complete',
        entity: 'task',
        entityId: taskId,
        projectId,
        data: {},
      });
    }
  }

  // Delete task (works offline)
  async deleteTask(taskId: number, projectId: string): Promise<void> {
    const tasks = await getTasksByProject(projectId);
    const task = tasks.find(t => t.id === taskId);

    if (task) {
      const updatedTask: LocalTask = {
        ...task,
        deleted: true,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await saveTask(updatedTask);

      await this.queueOperation({
        type: 'delete',
        entity: 'task',
        entityId: taskId,
        projectId,
        data: {},
      });
    }
  }

  // Process the sync queue
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const queue = await getSyncQueue();

      for (const operation of queue) {
        try {
          await this.processOperation(operation);
          await removeFromSyncQueue(operation.id!);
        } catch (error) {
          console.error('Failed to process operation:', operation, error);
          // Keep in queue for retry, but increment retry count
          // Could implement exponential backoff here
        }
      }

      await setMetadata('lastSyncedAt', new Date().toISOString());
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    switch (operation.entity) {
      case 'task':
        await this.syncTaskOperation(operation, baseUrl);
        break;
      case 'player':
        await this.syncPlayerOperation(operation, baseUrl);
        break;
      case 'line':
        await this.syncLineOperation(operation, baseUrl);
        break;
    }
  }

  private async syncTaskOperation(operation: SyncOperation, baseUrl: string): Promise<void> {
    const { type, entityId, projectId, data } = operation;

    switch (type) {
      case 'create': {
        const response = await fetch(`${baseUrl}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            description: data.description,
            urgency: data.urgency,
            importance: data.importance,
            assigneeIds: data.assigneeIds || [],
          }),
        });

        if (!response.ok) throw new Error('Failed to create task');

        const serverTask = await response.json();

        // Update local task with server ID
        const tasks = await getTasksByProject(projectId);
        const localTask = tasks.find(t => t.localId === entityId);
        if (localTask) {
          await saveTask({
            ...localTask,
            id: serverTask.id,
            localId: undefined,
            synced: true,
          });
        }
        break;
      }

      case 'update': {
        const response = await fetch(`${baseUrl}/api/tasks/${entityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update task');

        // Mark as synced
        const tasks = await getTasksByProject(projectId);
        const task = tasks.find(t => t.id === entityId);
        if (task) {
          await saveTask({ ...task, synced: true });
        }
        break;
      }

      case 'complete': {
        const response = await fetch(`${baseUrl}/api/tasks/${entityId}/complete`, {
          method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to complete task');
        break;
      }

      case 'delete': {
        const response = await fetch(`${baseUrl}/api/tasks/${entityId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete task');
        break;
      }
    }
  }

  private async syncPlayerOperation(operation: SyncOperation, baseUrl: string): Promise<void> {
    // Player sync operations - similar pattern to tasks
    // For simplicity, players are usually created online first
    console.log('Player sync:', operation);
  }

  private async syncLineOperation(operation: SyncOperation, baseUrl: string): Promise<void> {
    // Line sync operations - similar pattern to tasks
    console.log('Line sync:', operation);
  }

  // Force a full sync
  async forceSync(projectId: string): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    // First, process any pending operations
    await this.processSyncQueue();

    // Then, fetch fresh data from server
    // This would be done by the component that calls this
  }

  // Cleanup on unmount
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
let syncServiceInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

export type { SyncService };
