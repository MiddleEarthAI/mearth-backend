// import { TwitterApi, TweetV2, UserV2 } from "twitter-api-v2";
// import { logger } from "./logger";

// export interface TweetData {
//   id: string;
//   text: string;
//   author_id?: string;
//   created_at?: string;
//   public_metrics?: {
//     retweet_count: number;
//     reply_count: number;
//     like_count: number;
//     quote_count: number;
//   };
//   conversation_id?: string;
//   in_reply_to_user_id?: string;
//   referenced_tweets?: {
//     type: "replied_to" | "quoted" | "retweeted";
//     id: string;
//   }[];
// }

// export interface TwitterInteraction {
//   type: "reply" | "quote" | "retweet" | "like" | "mention";
//   userId: string;
//   username: string;
//   followerCount: number;
//   verified: boolean;
//   tweetId: string;
//   content?: string;
//   timestamp: Date;
// }

// /**
//  * Fetches recent tweets for a given username
//  * @param client - TwitterApi client instance
//  * @param username - Twitter username to fetch tweets for
//  * @param count - Number of tweets to fetch (default: 10)
//  * @returns Array of tweet data
//  */
// export async function fetchRecentTweets(
//   client: TwitterApi,
//   username: string,
//   count: number = 10
// ): Promise<TweetData[]> {
//   try {
//     // Get user by username first
//     const user = await client.v2.userByUsername(username);

//     if (!user.data) {
//       throw new Error(`User ${username} not found`);
//     }

//     // Fetch tweets with expanded objects
//     const tweets = await client.v2.userTimeline(user.data.id, {
//       max_results: count,
//       "tweet.fields": [
//         "created_at",
//         "public_metrics",
//         "text",
//         "conversation_id",
//         "in_reply_to_user_id",
//         "referenced_tweets",
//       ],
//       "user.fields": [
//         "name",
//         "username",
//         "verified",
//         "profile_image_url",
//         "public_metrics",
//       ],
//       expansions: [
//         "author_id",
//         "referenced_tweets.id",
//         "in_reply_to_user_id",
//         "attachments.media_keys",
//       ],
//     });

//     return tweets.data.data;
//   } catch (error) {
//     logger.error("Error fetching tweets:", error);
//     throw error;
//   }
// }

// /**
//  * Fetches a single tweet by ID
//  * @param client - TwitterApi client instance
//  * @param tweetId - ID of the tweet to fetch
//  * @returns Tweet data
//  */
// export async function fetchTweetById(
//   client: TwitterApi,
//   tweetId: string
// ): Promise<TweetData> {
//   try {
//     const tweet = await client.v2.singleTweet(tweetId, {
//       "tweet.fields": [
//         "created_at",
//         "public_metrics",
//         "text",
//         "conversation_id",
//         "in_reply_to_user_id",
//         "referenced_tweets",
//       ],
//     });

//     if (!tweet.data) {
//       throw new Error(`Tweet ${tweetId} not found`);
//     }

//     return tweet.data;
//   } catch (error) {
//     logger.error("Error fetching tweet:", error);
//     throw error;
//   }
// }

// /**
//  * Posts a new tweet
//  * @param client - TwitterApi client instance
//  * @param text - Tweet content
//  * @param replyToTweetId - Optional tweet ID to reply to
//  * @returns Posted tweet data
//  */
// export async function postTweet(
//   client: TwitterApi,
//   text: string,
//   replyToTweetId?: string
// ): Promise<TweetData> {
//   try {
//     const tweetData: any = { text };
//     if (replyToTweetId) {
//       tweetData.reply = { in_reply_to_tweet_id: replyToTweetId };
//     }

//     const tweet = await client.v2.tweet(tweetData);
//     return tweet.data;
//   } catch (error) {
//     logger.error("Error posting tweet:", error);
//     throw error;
//   }
// }

// /**
//  * Fetches replies to a specific tweet
//  * @param client - TwitterApi client instance
//  * @param tweetId - ID of the tweet to fetch replies for
//  * @returns Array of reply tweets
//  */
// export async function fetchTweetReplies(
//   client: TwitterApi,
//   tweetId: string
// ): Promise<TweetData[]> {
//   try {
//     const replies = await client.v2.search(
//       `conversation_id:${tweetId} is:reply`,
//       {
//         "tweet.fields": [
//           "created_at",
//           "public_metrics",
//           "text",
//           "conversation_id",
//           "in_reply_to_user_id",
//           "referenced_tweets",
//         ],
//         "user.fields": ["name", "username", "verified", "public_metrics"],
//         expansions: ["author_id", "referenced_tweets.id"],
//       }
//     );

//     return replies.data.data || [];
//   } catch (error) {
//     logger.error("Error fetching replies:", error);
//     throw error;
//   }
// }

// /**
//  * Fetches user information
//  * @param client - TwitterApi client instance
//  * @param username - Twitter username
//  * @returns User data
//  */
// export async function fetchUserInfo(
//   client: TwitterApi,
//   username: string
// ): Promise<UserV2> {
//   try {
//     const user = await client.v2.userByUsername(username, {
//       "user.fields": [
//         "created_at",
//         "description",
//         "public_metrics",
//         "verified",
//         "profile_image_url",
//       ],
//     });

//     if (!user.data) {
//       throw new Error(`User ${username} not found`);
//     }

//     return user.data;
//   } catch (error) {
//     logger.error("Error fetching user info:", error);
//     throw error;
//   }
// }

// /**
//  * Fetches quotes of a specific tweet
//  * @param client - TwitterApi client instance
//  * @param tweetId - ID of the tweet to fetch quotes for
//  * @returns Array of tweet data
//  */
// export async function fetchTweetQuotes(
//   client: TwitterApi,
//   tweetId: string
// ): Promise<TweetData[]> {
//   try {
//     const quotes = await client.v2.search(`quoted_tweet_id:${tweetId}`, {
//       "tweet.fields": [
//         "created_at",
//         "public_metrics",
//         "text",
//         "conversation_id",
//         "in_reply_to_user_id",
//         "referenced_tweets",
//         "author_id",
//       ],
//       "user.fields": ["name", "username", "verified", "public_metrics"],
//       expansions: ["author_id", "referenced_tweets.id"],
//     });

//     return quotes.data.data || [];
//   } catch (error) {
//     logger.error("Error fetching quotes:", error);
//     throw error;
//   }
// }

// /**
//  * Fetches mentions of a specific user
//  * @param client - TwitterApi client instance
//  * @param username - Username to fetch mentions for
//  * @param count - Number of mentions to fetch (default: 100)
//  * @returns Array of tweet data
//  */
// export async function fetchUserMentions(
//   client: TwitterApi,
//   username: string,
//   count: number = 100
// ): Promise<TweetData[]> {
//   try {
//     const mentions = await client.v2.search(`@${username}`, {
//       max_results: count,
//       "tweet.fields": [
//         "created_at",
//         "public_metrics",
//         "text",
//         "conversation_id",
//         "in_reply_to_user_id",
//         "referenced_tweets",
//         "author_id",
//       ],
//       "user.fields": ["name", "username", "verified", "public_metrics"],
//       expansions: ["author_id", "referenced_tweets.id"],
//     });

//     return mentions.data.data || [];
//   } catch (error) {
//     logger.error("Error fetching mentions:", error);
//     throw error;
//   }
// }

// /**
//  * Fetches tweet interactions (replies, quotes, retweets)
//  * @param client - TwitterApi client instance
//  * @param tweetId - ID of the tweet to fetch interactions for
//  * @param username - Username of the tweet author
//  * @returns Array of interactions
//  */
// export async function fetchTweetInteractions(
//   client: TwitterApi,
//   tweetId: string,
//   username: string
// ): Promise<TwitterInteraction[]> {
//   try {
//     const interactions: TwitterInteraction[] = [];

//     // Fetch replies
//     const replies = await fetchTweetReplies(client, tweetId);
//     for (const reply of replies) {
//       const user = await fetchUserInfo(client, reply.in_reply_to_user_id!);
//       interactions.push({
//         type: "reply",
//         userId: user.id,
//         username: user.username,
//         followerCount: user.public_metrics?.followers_count || 0,
//         verified: user.verified || false,
//         tweetId: reply.id,
//         content: reply.text,
//         timestamp: new Date(reply.created_at!),
//       });
//     }

//     // Fetch quotes
//     const quotes = await fetchTweetQuotes(client, tweetId);
//     for (const quote of quotes) {
//       const user = await fetchUserInfo(client, quote.author_id!);
//       interactions.push({
//         type: "quote",
//         userId: user.id,
//         username: user.username,
//         followerCount: user.public_metrics?.followers_count || 0,
//         verified: user.verified || false,
//         tweetId: quote.id,
//         content: quote.text,
//         timestamp: new Date(quote.created_at!),
//       });
//     }

//     // Fetch mentions
//     const mentions = await fetchUserMentions(client, username);
//     for (const mention of mentions) {
//       // Skip if the mention is already counted as a reply or quote
//       if (interactions.some((i) => i.tweetId === mention.id)) continue;

//       const user = await fetchUserInfo(client, mention.author_id!);
//       interactions.push({
//         type: "mention",
//         userId: user.id,
//         username: user.username,
//         followerCount: user.public_metrics?.followers_count || 0,
//         verified: user.verified || false,
//         tweetId: mention.id,
//         content: mention.text,
//         timestamp: new Date(mention.created_at!),
//       });
//     }

//     return interactions;
//   } catch (error) {
//     logger.error("Error fetching tweet interactions:", error);
//     throw error;
//   }
// }

// /**
//  * Calculates engagement score for a tweet based on interactions
//  * @param tweet - Tweet data
//  * @param interactions - Array of tweet interactions
//  * @returns Engagement score between 0 and 1
//  */
// export function calculateEngagementScore(
//   tweet: TweetData,
//   interactions: TwitterInteraction[]
// ): number {
//   if (!tweet.public_metrics) return 0;

//   const metrics = tweet.public_metrics;
//   const totalEngagement =
//     metrics.like_count +
//     metrics.retweet_count +
//     metrics.reply_count +
//     metrics.quote_count;

//   const verifiedInteractions = interactions.filter((i) => i.verified).length;
//   const highFollowerInteractions = interactions.filter(
//     (i) => i.followerCount > 10000
//   ).length;

//   // Weight different factors
//   const engagementWeight = 0.5;
//   const verifiedWeight = 0.3;
//   const followerWeight = 0.2;

//   const engagementScore =
//     Math.min(totalEngagement / 1000, 1) * engagementWeight;
//   const verifiedScore =
//     (verifiedInteractions / interactions.length) * verifiedWeight;
//   const followerScore =
//     (highFollowerInteractions / interactions.length) * followerWeight;

//   return engagementScore + verifiedScore + followerScore;
// }

// /**
//  * Analyzes sentiment of tweet interactions
//  * @param interactions - Array of tweet interactions
//  * @returns Object containing sentiment analysis
//  */
// export function analyzeSentiment(interactions: TwitterInteraction[]): {
//   positive: number;
//   negative: number;
//   neutral: number;
//   total: number;
// } {
//   // This is a simple implementation. Consider using a proper NLP library
//   const sentiment = {
//     positive: 0,
//     negative: 0,
//     neutral: 0,
//     total: interactions.length,
//   };

//   const positiveWords = [
//     "good",
//     "great",
//     "awesome",
//     "love",
//     "excellent",
//     "win",
//     "support",
//   ];
//   const negativeWords = [
//     "bad",
//     "terrible",
//     "hate",
//     "awful",
//     "poor",
//     "lose",
//     "attack",
//   ];

//   interactions.forEach((interaction) => {
//     if (!interaction.content) {
//       sentiment.neutral++;
//       return;
//     }

//     const text = interaction.content.toLowerCase();
//     const hasPositive = positiveWords.some((word) => text.includes(word));
//     const hasNegative = negativeWords.some((word) => text.includes(word));

//     if (hasPositive && !hasNegative) sentiment.positive++;
//     else if (hasNegative && !hasPositive) sentiment.negative++;
//     else sentiment.neutral++;
//   });

//   return sentiment;
// }
