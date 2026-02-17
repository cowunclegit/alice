import { StateGraph, END } from '@langchain/langgraph';
import { plannerNode } from './planner.js';
import { analyzerNode } from './analyzer.js';
import { coderNode } from './coder.js';
import { executorNode } from './executor.js';
import { debuggerNode } from './debugger.js';
import { evaluatorNode } from './evaluator.js';
import { recorderNode } from './recorder.js';
import { finalizerNode } from './finalizer.js';

export function createGraph(config) {
  const workflow = new StateGraph({
    channels: {
      requirement: null,
      title: { reducer: (a, b) => b },
      description: { reducer: (a, b) => b },
      plan: { reducer: (a, b) => b },
      plan_status: { reducer: (a, b) => b },
      dynamicTimeout: { reducer: (a, b) => b },
      html_content: { reducer: (a, b) => b },
      current_url: { reducer: (a, b) => b },
      analysis_goal: { reducer: (a, b) => b },
      analysis_results: { reducer: (a, b) => b },
      analysis_strategy: { reducer: (a, b) => b },
      element_inventory: { reducer: (a, b) => b },
      scriptContent: { reducer: (a, b) => b },
      uuid: null,
      executionResult: { reducer: (a, b) => b },
      retryCount: { reducer: (a, b) => b },
      analysis: { reducer: (a, b) => b },
      fixProposal: { reducer: (a, b) => b },
      isSuccess: { reducer: (a, b) => b },
      needsReplan: { reducer: (a, b) => b },
      history: { reducer: (a, b) => a.concat(b) },
      page_history: { 
        reducer: (a, b) => {
          const current = a || [];
          const updates = b || [];
          
          // If update has a 'url', check if it's already the last entry
          // If it matches last entry, MERGE it. If it's new, CONCAT it.
          if (updates.length > 0) {
            const lastIdx = current.length - 1;
            const newEntry = updates[0];
            
            if (lastIdx >= 0 && current[lastIdx].url === newEntry.url) {
              const merged = [...current];
              merged[lastIdx] = { ...merged[lastIdx], ...newEntry };
              return merged;
            }
            return current.concat(updates);
          }
          return current;
        }
      }
    }
  });

  const wrapNode = (name, nodeFunc) => {
    return async (state) => {
      console.log(`\n--- Node: ${name.toUpperCase()} ---`);
      return await nodeFunc(state, config);
    };
  };

  workflow.addNode('planner', wrapNode('planner', plannerNode));
  workflow.addNode('analyzer', wrapNode('analyzer', analyzerNode));
  workflow.addNode('coder', wrapNode('coder', coderNode));
  workflow.addNode('executor', wrapNode('executor', executorNode));
  workflow.addNode('recorder', wrapNode('recorder', recorderNode));
  workflow.addNode('debugger', wrapNode('debugger', debuggerNode));
  workflow.addNode('evaluator', wrapNode('evaluator', evaluatorNode));
  workflow.addNode('finalizer', wrapNode('finalizer', finalizerNode));

  workflow.setEntryPoint('planner');
  
  workflow.addConditionalEdges(
    'planner',
    (state) => {
      if (state.html_content) return 'analyzer';
      return 'coder';
    },
    {
      analyzer: 'analyzer',
      coder: 'coder'
    }
  );

  workflow.addEdge('coder', 'executor');
  workflow.addEdge('executor', 'recorder');

  workflow.addConditionalEdges(
    'recorder',
    (state) => {
      if (state.executionResult.exitCode !== 0) {
        if (state.retryCount >= 10) return 'finalizer';
        if (state.html_content) return 'analyzer_healing'; 
        return 'debugger';
      }
      return 'evaluator';
    },
    {
      finalizer: 'finalizer',
      analyzer_healing: 'analyzer',
      debugger: 'debugger',
      evaluator: 'evaluator'
    }
  );

  workflow.addConditionalEdges(
    'analyzer',
    (state) => {
      // If we have an executionResult, it means we came from a failure (healing loop)
      if (state.executionResult) return 'debugger';
      // Otherwise, it's the initial analysis before coding
      return 'coder';
    },
    {
      debugger: 'debugger',
      coder: 'coder'
    }
  );

  workflow.addEdge('debugger', 'executor'); // After fixing, try executing again

  workflow.addConditionalEdges(
    'evaluator',
    (state) => {
      if (state.isSuccess) return 'finalizer';
      if (state.retryCount >= 10) return 'finalizer';
      if (state.needsReplan) return 'planner'; // Trigger Re-plan
      return 'debugger'; // Simple retry or fix
    },
    {
      finalizer: 'finalizer',
      planner: 'planner',
      debugger: 'debugger'
    }
  );

  workflow.addEdge('finalizer', END);

  return workflow.compile();
}
