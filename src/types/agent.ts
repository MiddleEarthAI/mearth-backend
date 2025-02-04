export interface AgentTrait {
  name: string;
  value: number;
  description: string;
}

export interface ActionContext {
  agentId: number;
  gameId: number;
  currentState: any;
}
