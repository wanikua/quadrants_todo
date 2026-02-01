/**
 * Local IndexedDB database for offline-first data storage
 * Uses native IndexedDB API for maximum compatibility
 */

const DB_NAME = 'quadrants_offline';
const DB_VERSION = 1;

export interface LocalTask {
  id: number;
  localId?: string; // For tasks created offline
  project_id: string;
  description: string;
  urgency: number;
  importance: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  synced: boolean;
  deleted: boolean; // Soft delete for sync
  assignee_ids: number[];
}

export interface LocalPlayer {
  id: number;
  localId?: string;
  project_id: string;
  user_id?: string;
  name: string;
  color: string;
  created_at: string;
  synced: boolean;
  deleted: boolean;
}

export interface LocalLine {
  id: number;
  localId?: string;
  project_id: string;
  from_task_id: number;
  to_task_id: number;
  style?: string;
  size?: number;
  color?: string;
  created_at: string;
  synced: boolean;
  deleted: boolean;
}

export interface SyncOperation {
  id?: number;
  type: 'create' | 'update' | 'delete' | 'complete';
  entity: 'task' | 'player' | 'line';
  entityId: number | string;
  projectId: string;
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
}

export interface LocalProject {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'team';
  owner_id: string;
  archived: boolean;
  lastSyncedAt?: string;
}

let db: IDBDatabase | null = null;

export async function openDatabase(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Tasks store
      if (!database.objectStoreNames.contains('tasks')) {
        const taskStore = database.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('project_id', 'project_id', { unique: false });
        taskStore.createIndex('synced', 'synced', { unique: false });
        taskStore.createIndex('localId', 'localId', { unique: false });
      }

      // Players store
      if (!database.objectStoreNames.contains('players')) {
        const playerStore = database.createObjectStore('players', { keyPath: 'id' });
        playerStore.createIndex('project_id', 'project_id', { unique: false });
        playerStore.createIndex('synced', 'synced', { unique: false });
      }

      // Lines store
      if (!database.objectStoreNames.contains('lines')) {
        const lineStore = database.createObjectStore('lines', { keyPath: 'id' });
        lineStore.createIndex('project_id', 'project_id', { unique: false });
        lineStore.createIndex('synced', 'synced', { unique: false });
      }

      // Projects store
      if (!database.objectStoreNames.contains('projects')) {
        const projectStore = database.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('owner_id', 'owner_id', { unique: false });
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('entity', 'entity', { unique: false });
      }

      // Metadata store for sync state
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

// Generic CRUD operations
async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const store = await getStore(storeName);
  const index = store.index(indexName);
  return new Promise((resolve, reject) => {
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put<T>(storeName: string, value: T): Promise<IDBValidKey> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function remove(storeName: string, key: IDBValidKey): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clear(storeName: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Task-specific operations
export async function getTasksByProject(projectId: string): Promise<LocalTask[]> {
  const tasks = await getByIndex<LocalTask>('tasks', 'project_id', projectId);
  return tasks.filter(t => !t.deleted && !t.archived);
}

export async function saveTask(task: LocalTask): Promise<void> {
  await put('tasks', task);
}

export async function saveTasks(tasks: LocalTask[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('tasks', 'readwrite');
  const store = transaction.objectStore('tasks');

  for (const task of tasks) {
    store.put(task);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Player-specific operations
export async function getPlayersByProject(projectId: string): Promise<LocalPlayer[]> {
  const players = await getByIndex<LocalPlayer>('players', 'project_id', projectId);
  return players.filter(p => !p.deleted);
}

export async function savePlayer(player: LocalPlayer): Promise<void> {
  await put('players', player);
}

export async function savePlayers(players: LocalPlayer[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('players', 'readwrite');
  const store = transaction.objectStore('players');

  for (const player of players) {
    store.put(player);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Line-specific operations
export async function getLinesByProject(projectId: string): Promise<LocalLine[]> {
  const lines = await getByIndex<LocalLine>('lines', 'project_id', projectId);
  return lines.filter(l => !l.deleted);
}

export async function saveLines(lines: LocalLine[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('lines', 'readwrite');
  const store = transaction.objectStore('lines');

  for (const line of lines) {
    store.put(line);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Sync queue operations
export async function addToSyncQueue(operation: Omit<SyncOperation, 'id'>): Promise<void> {
  await put('syncQueue', operation);
}

export async function getSyncQueue(): Promise<SyncOperation[]> {
  return getAll<SyncOperation>('syncQueue');
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  await remove('syncQueue', id);
}

export async function clearSyncQueue(): Promise<void> {
  await clear('syncQueue');
}

// Project operations
export async function getProject(projectId: string): Promise<LocalProject | undefined> {
  return get<LocalProject>('projects', projectId);
}

export async function saveProject(project: LocalProject): Promise<void> {
  await put('projects', project);
}

export async function getProjectsForUser(userId: string): Promise<LocalProject[]> {
  return getByIndex<LocalProject>('projects', 'owner_id', userId);
}

// Metadata operations
export async function getMetadata<T>(key: string): Promise<T | undefined> {
  const result = await get<{ key: string; value: T }>('metadata', key);
  return result?.value;
}

export async function setMetadata<T>(key: string, value: T): Promise<void> {
  await put('metadata', { key, value });
}

// Generate local ID for offline-created entities
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if ID is a local ID
export function isLocalId(id: number | string): boolean {
  return typeof id === 'string' && id.startsWith('local_');
}
