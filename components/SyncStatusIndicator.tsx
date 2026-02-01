'use client';

/**
 * Visual indicator for sync status
 * Shows online/offline state and pending sync operations
 */

import { useEffect, useState } from 'react';
import { getSyncService, SyncStatus } from '@/app/lib/offline';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({
  className = '',
  showDetails = false,
}: SyncStatusIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
  });

  useEffect(() => {
    const syncService = getSyncService();
    const unsubscribe = syncService.subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4 text-orange-500" />;
    }
    if (status.isSyncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (status.pendingOperations > 0) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <Check className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    if (status.isSyncing) {
      return 'Syncing...';
    }
    if (status.pendingOperations > 0) {
      return `${status.pendingOperations} pending`;
    }
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!status.isOnline) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    if (status.isSyncing) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (status.pendingOperations > 0) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor()} ${className}`}
      title={status.lastSyncedAt ? `Last synced: ${new Date(status.lastSyncedAt).toLocaleString()}` : 'Not synced yet'}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {showDetails && status.lastSyncedAt && (
        <span className="text-[10px] opacity-70">
          {new Date(status.lastSyncedAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

/**
 * Offline banner shown at the top of the page when offline
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const syncService = getSyncService();
    const unsubscribe = syncService.subscribe((status) => {
      setIsOffline(!status.isOnline);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>You&apos;re offline. Changes will sync when you reconnect.</span>
    </div>
  );
}
