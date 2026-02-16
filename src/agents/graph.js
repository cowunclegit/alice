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
      title: null,
      description: null,
      plan: { reducer: (a, b) => b },
      plan_status: null,
      dynamicTimeout: null,
      html_content: null,
      current_url: null,
      analysis_goal: null,
      analysis_results: null,
      analysis_strategy: null,
      scriptContent: { reducer: (a, b) => b },
      uuid: null,
      executionResult: { reducer: (a, b) => b },
      retryCount: { reducer: (a, b) => b },
      analysis: { reducer: (a, b) => b },
      fixProposal: { reducer: (a, b) => b },
      isSuccess: null,
      needsReplan: null,
      history: { reducer: (a, b) => a.concat(b) }
    }
  });

  workflow.addNode('planner', async (state) => {
    console.log('\n--- Node: Planner ---');
    return await plannerNode(state, config);
  });
  workflow.addNode('analyzer', async (state) => {
    console.log('\n--- Node: Analyzer ---');
    return await analyzerNode(state, config);
  });
  workflow.addNode('coder', async (state) => {
    console.log('\n--- Node: Coder ---');
    return await coderNode(state, config);
  });
  workflow.addNode('executor', async (state) => {
    console.log('\n--- Node: Executor ---');
    return await executorNode(state, config);
  });
  workflow.addNode('recorder', async (state) => {
    console.log('\n--- Node: Recorder ---');
    return await recorderNode(state, config);
  });
  workflow.addNode('debugger', async (state) => {
    console.log('\n--- Node: Debugger ---');
    return await debuggerNode(state, config);
  });
  workflow.addNode('evaluator', async (state) => {
    console.log('\n--- Node: Evaluator ---');
    return await evaluatorNode(state, config);
  });
  workflow.addNode('finalizer', async (state) => {
    console.log('\n--- Node: Finalizer ---');
    return await finalizerNode(state, config);
  });

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

  workflow.addEdge('analyzer', 'coder');
  workflow.addEdge('coder', 'executor');
  workflow.addEdge('executor', 'recorder');

  workflow.addConditionalEdges(
    'recorder',
    (state) => {
      if (state.executionResult.exitCode !== 0) {
        if (state.retryCount >= 5) return 'finalizer';
        if (state.html_content) return 'analyzer'; // Analyze first on failure
        return 'debugger';
      }
      return 'evaluator';
    },
    {
      finalizer: 'finalizer',
      analyzer: 'analyzer',
      debugger: 'debugger',
      evaluator: 'evaluator'
    }
  );

  workflow.addEdge('analyzer', 'debugger'); // After analysis, go to debugger with facts
  workflow.addEdge('debugger', 'executor'); // Retry execution after fix

  workflow.addConditionalEdges(
    'evaluator',
    (state) => {
      if (state.isSuccess) return 'finalizer';
      if (state.retryCount >= 5) return 'finalizer';
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
