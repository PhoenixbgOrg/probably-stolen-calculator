/**
 * Web Worker for Dream Dust production planner.
 * Latest-only: a newer request id aborts the in-flight cooperative search loop.
 */

import {
  solveProductionPlanAsync,
  type ProductionPlannerInput,
  type ProductionPlan,
} from '../calculators/dreamDustPlanner';

export interface WorkerRequest {
  id: string;
  input: ProductionPlannerInput;
}

export interface WorkerCancel {
  type: 'cancel';
}

export interface WorkerResponse {
  id: string;
  result: ProductionPlan | null;
  error: string | null;
}

let activeId: string | null = null;

self.onmessage = (event: MessageEvent<WorkerRequest | WorkerCancel>) => {
  if ('type' in event.data && event.data.type === 'cancel') {
    activeId = null;
    return;
  }

  const { id, input } = event.data as WorkerRequest;
  activeId = id;

  void solveProductionPlanAsync(input, {
    shouldAbort: () => activeId !== id,
    yieldEvery: 8,
  })
    .then((result) => {
      if (activeId !== id) return;
      const response: WorkerResponse = { id, result, error: null };
      self.postMessage(response);
    })
    .catch((error: unknown) => {
      if (activeId !== id) return;
      const response: WorkerResponse = {
        id,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      };
      self.postMessage(response);
    });
};
