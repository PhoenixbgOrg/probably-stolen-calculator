import { useRef, useCallback, useEffect } from 'react';
import type { ProductionPlannerInput, ProductionPlan } from '../calculators/dreamDustPlanner';

interface WorkerRequest {
  id: string;
  input: ProductionPlannerInput;
}

interface WorkerResponse {
  id: string;
  result: ProductionPlan | null;
  error: string | null;
}

export function usePlannerWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestRef = useRef<string | null>(null);
  const callbacksRef = useRef<Map<string, (result: ProductionPlan | null, error: string | null) => void>>(new Map());

  useEffect(() => {
    // Initialize worker on mount
    try {
      workerRef.current = new Worker(
        new URL('../workers/plannerWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, result, error } = event.data;
        const callback = callbacksRef.current.get(id);
        
        if (callback) {
          callback(result, error);
          callbacksRef.current.delete(id);
        }
        
        if (pendingRequestRef.current === id) {
          pendingRequestRef.current = null;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        // Notify all pending callbacks
        callbacksRef.current.forEach(callback => {
          callback(null, 'Worker error: ' + error.message);
        });
        callbacksRef.current.clear();
        pendingRequestRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      workerRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      callbacksRef.current.clear();
      pendingRequestRef.current = null;
    };
  }, []);

  const solve = useCallback(
    (
      input: ProductionPlannerInput,
      onResult: (result: ProductionPlan | null, error: string | null) => void
    ): (() => void) => {
      if (!workerRef.current) {
        // Fallback to synchronous execution if worker unavailable
        console.warn('Worker not available, falling back to synchronous execution');
        try {
          const { solveProductionPlan } = require('../calculators/dreamDustPlanner');
          const result = solveProductionPlan(input);
          setTimeout(() => onResult(result, null), 0);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          setTimeout(() => onResult(null, errorMsg), 0);
        }
        return () => {}; // No-op cancel
      }

      const requestId = `${Date.now()}-${Math.random()}`;
      
      // Cancel any pending request (latest-result-only)
      if (pendingRequestRef.current) {
        const oldId = pendingRequestRef.current;
        const oldCallback = callbacksRef.current.get(oldId);
        if (oldCallback) {
          oldCallback(null, 'Cancelled by newer request');
          callbacksRef.current.delete(oldId);
        }
      }
      
      pendingRequestRef.current = requestId;
      callbacksRef.current.set(requestId, onResult);

      const request: WorkerRequest = {
        id: requestId,
        input,
      };

      workerRef.current.postMessage(request);

      // Return cancel function
      return () => {
        if (pendingRequestRef.current === requestId) {
          pendingRequestRef.current = null;
          const callback = callbacksRef.current.get(requestId);
          if (callback) {
            callback(null, 'Cancelled by user');
            callbacksRef.current.delete(requestId);
          }
        }
      };
    },
    []
  );

  const cancel = useCallback(() => {
    if (pendingRequestRef.current) {
      const id = pendingRequestRef.current;
      const callback = callbacksRef.current.get(id);
      if (callback) {
        callback(null, 'Cancelled by user');
        callbacksRef.current.delete(id);
      }
      pendingRequestRef.current = null;
    }
  }, []);

  const isPending = useCallback(() => {
    return pendingRequestRef.current !== null;
  }, []);

  return { solve, cancel, isPending };
}
