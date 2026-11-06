/**
 * Web Worker for Dream Dust production planner.
 * Runs solver in background thread to keep UI responsive.
 */

import { solveProductionPlan, type ProductionPlannerInput, type ProductionPlan } from '../calculators/dreamDustPlanner';

export interface WorkerRequest {
  id: string;
  input: ProductionPlannerInput;
}

export interface WorkerResponse {
  id: string;
  result: ProductionPlan | null;
  error: string | null;
}

// Listen for messages from main thread
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, input } = event.data;
  
  try {
    const result = solveProductionPlan(input);
    
    const response: WorkerResponse = {
      id,
      result,
      error: null,
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
    
    self.postMessage(response);
  }
};
