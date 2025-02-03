// Environment configuration
// const config = {
//   twitter: {
//     apiKey: process.env.TWITTER_API_KEY!,
//     apiSecret: process.env.TWITTER_API_SECRET!,
//     accessToken: process.env.TWITTER_ACCESS_TOKEN!,
//     accessSecret: process.env.TWITTER_ACCESS_SECRET!,
//   },
//   openai: {
//     apiKey: process.env.OPENAI_API_KEY!,
//   },
//   redis: {
//     url: process.env.REDIS_URL!,
//   },
//   database: {
//     url: process.env.DATABASE_URL!,
//   },
// };

// Core types and interfaces
interface AgentTrait {
  name: string;
  value: number;
  description: string;
}

interface Position {
  x: number;
  y: number;
}

interface UserMetrics {
  followerCount: number;
  averageEngagement: number;
  accountAge: number;
  verificationStatus: boolean;
  reputationScore: number;
}

interface InfluenceScore {
  interactionId: string;
  score: number;
  suggestion: ActionSuggestion;
}

interface ActionSuggestion {
  type: "MOVE" | "BATTLE" | "ALLIANCE" | "STRATEGY";
  target?: string; // agentId
  position?: Position;
  content: string;
}
