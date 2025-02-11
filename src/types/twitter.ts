import { Position } from ".";

export interface AgentTrait {
  name: string;
  value: number;
  description: string;
}

export interface InfluenceScore {
  interactionId: string;
  score: number;
  suggestion: ActionSuggestion;
}

export interface ActionSuggestion {
  type: "MOVE" | "BATTLE" | "ALLIANCE" | "IGNORE" | "STRATEGY";
  target?: string; // agentId
  position?: Position;
  content?: string;
}

export interface TweetData {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  conversation_id?: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: {
    type: "replied_to" | "quoted" | "retweeted";
    id: string;
  }[];
}

export interface TwitterInteraction {
  type: "reply" | "quote" | "mention";
  userId: string;
  username: string;
  tweetId: string;
  content?: string;
  authorId?: string;
  timestamp: Date;
  userMetrics: UserMetrics;
}

export interface UserMetrics {
  followerCount: number;
  followingCount: number;
  likeCount: number;
  accountAge: number; // number of seconds past since account was created
  tweetCount: number;
  listedCount: number;
  verified: boolean;
  reputationScore: number;
}

// Log types for different game events
export type LogType =
  | "BATTLE"
  | "MOVEMENT"
  | "ALLIANCE"
  | "SYSTEM"
  | "ERROR"
  | "AGENT_ACTION";

// Log levels for filtering
export type LogLevel = "INFO" | "WARNING" | "ERROR" | "DEBUG";

// Structure for game logs
export interface GameLog {
  id: string;
  timestamp: number;
  type: LogType;
  level: LogLevel;
  message: string;
  data?: any;
  agentId?: string;
  gameId?: string;
}

// Log filter options
export interface LogFilter {
  types?: LogType[];
  levels?: LogLevel[];
  agentId?: string;
  gameId?: string;
  startTime?: number;
  endTime?: number;
}

// WebSocket message types
export type WSMessageType = "FILTER" | "FILTERED_LOGS" | "LOG";

export interface WSMessage {
  type: WSMessageType;
  payload: any;
}

export interface FilterMessage extends WSMessage {
  type: "FILTER";
  payload: LogFilter;
}

export interface FilteredLogsMessage extends WSMessage {
  type: "FILTERED_LOGS";
  payload: {
    logs: GameLog[];
  };
}

export interface LogMessage extends WSMessage {
  type: "LOG";
  payload: GameLog;
}
