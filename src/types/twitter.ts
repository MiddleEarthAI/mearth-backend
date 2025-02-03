export interface AgentTrait {
  name: string;
  value: number;
  description: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface UserMetrics {
  followerCount: number;
  averageEngagement: number;
  accountAge: number;
  verificationStatus: boolean;
  reputationScore: number;
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
  tweet?: string;
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
  type: "reply" | "quote" | "retweet" | "like" | "mention";
  userId: string;
  username: string;
  tweetId: string;
  content?: string;
  timestamp: Date;
  userMetrics: UserMetrics;
}
