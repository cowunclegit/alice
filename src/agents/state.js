export const AgentState = {
  requirement: null,
  title: null,
  description: null,
  plan: [],
  plan_status: 'Draft',
  dynamicTimeout: '1m',
  scriptContent: null,
  uuid: null,
  current_url: null,
  html_content: null,
  element_inventory: null,
  analysis_results: [],
  analysis_strategy: null,
  analysis_goal: null,
  executionResult: null,
  retryCount: 0,
  isSuccess: false,
  needsReplan: false,
  history: [], // [{attempt: number, analysis: string, fix_proposal: string, result: string}]
  page_history: [] // [{url: string, last_action: string}]
};
