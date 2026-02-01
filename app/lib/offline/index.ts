/**
 * Offline-first data layer for Quadrants
 *
 * This module provides hybrid online/offline support:
 * - Local IndexedDB storage for caching tasks
 * - Automatic sync when online
 * - Queue operations when offline
 * - Conflict resolution (last-write-wins)
 *
 * Usage:
 * ```tsx
 * import { useOfflineData } from '@/app/lib/offline';
 *
 * function MyComponent({ projectId, initialTasks }) {
 *   const { tasks, syncStatus, createTask, updateTask } = useOfflineData({
 *     projectId,
 *     initialTasks,
 *   });
 *
 *   return (
 *     <div>
 *       {!syncStatus.isOnline && <OfflineBanner />}
 *       {tasks.map(task => <Task key={task.id} task={task} />)}
 *     </div>
 *   );
 * }
 * ```
 */

export { useOfflineData } from './useOfflineData';
export { getSyncService } from './sync';
export type { SyncStatus, SyncService } from './sync';
export type {
  LocalTask,
  LocalPlayer,
  LocalLine,
  LocalProject,
  SyncOperation,
} from './db';
export {
  openDatabase,
  getTasksByProject,
  getPlayersByProject,
  getLinesByProject,
  generateLocalId,
  isLocalId,
} from './db';
