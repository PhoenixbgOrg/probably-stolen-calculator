import { useRef, useCallback, useEffect } from 'react';
import { solveProductionPlan, type ProductionPlannerInput, type ProductionPlan } from '../calculators/dreamDustPlanner';

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
        if (pendingRequestRef.current !== id) {
          callbacksRef.current.delete(id);
          return;
        }
        const callback = callbacksRef.current.get(id);
        if (callback) {
          callback(result, error);
          callbacksRef.current.delete(id);
        }
        pendingRequestRef.current = null;
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
          const result = solveProductionPlan(input);
          setTimeout(() => onResult(result, null), 0);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          setTimeout(() => onResult(null, errorMsg), 0);
        }
        return () => {}; // No-op cancel
      }

      const requestId = `${Date.now()}-${Math.random()}`;
      
      // Latest-only: drop the superseded callback without treating it as a user-facing error.
      if (pendingRequestRef.current) {
        const oldId = pendingRequestRef.current;
        callbacksRef.current.delete(oldId);
        workerRef.current.postMessage({ type: 'cancel' });
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
          callbacksRef.current.delete(requestId);
          workerRef.current?.postMessage({ type: 'cancel' });
          onResult(null, 'Cancelled by user');
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
      workerRef.current?.postMessage({ type: 'cancel' });
    }
  }, []);

  const isPending = useCallback(() => {
    return pendingRequestRef.current !== null;
  }, []);

  return { solve, cancel, isPending };
}
