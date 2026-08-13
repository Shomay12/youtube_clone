import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { SpreadsheetDataService } from '../services/SpreadsheetDataService';

export function useSpreadsheetSync() {
  const {
    loadFromDatabase,
    loadFromSpreadsheet,
    spreadsheetConfig,
    isSpreadsheetLoading,
    showToast
  } = useStore();

  const intervalRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Attempt loading persistent state from Insforge Database first
    loadFromDatabase(true).then((success) => {
      if (!success) {
        loadFromSpreadsheet(true);
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [loadFromDatabase, loadFromSpreadsheet]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const seconds = spreadsheetConfig?.autoRefreshInterval;
    if (seconds && seconds > 0 && !isSpreadsheetLoading) {
      intervalRef.current = setInterval(() => {
        loadFromSpreadsheet(true);
      }, seconds * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spreadsheetConfig?.autoRefreshInterval, loadFromSpreadsheet, isSpreadsheetLoading]);

  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (spreadsheetConfig?.liveSync) {
      unsubscribeRef.current = SpreadsheetDataService.subscribeToEvents(async (event) => {
        if (event.type === 'data-updated') {
          await loadFromSpreadsheet(true, true);
          if (!useStore.getState().hasCrmOverrides) {
            showToast('Spreadsheet updated — data reloaded', 'info');
          }
        }
      });
    }

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [spreadsheetConfig?.liveSync, loadFromSpreadsheet, showToast]);
}
