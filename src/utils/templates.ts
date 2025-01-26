// Base template for ensuring JSON response format with detailed instructions for Claude
const baseResponseFormat = `
IMPORTANT: Your response must be a valid JSON object following this exact format. 
Please carefully consider your reasoning and confidence level before responding.

The response MUST be a JSON object with the following structure:

{
  "tool_calls": [
    {
      "name": string,     // Name of the available tool to call
      "input": object     // Parameters matching the tool's input schema exactly
    }
  ],
  "reasoning": string,    // Required: Detailed explanation of your decision-making process, tool choice rationale, and strategic considerations
  "response": string,     // Required: Final response incorporating tool results and addressing the user's request
  "confidence": number,   // Required: 0-1 score indicating confidence in decision (0.0 = no confidence, 1.0 = complete confidence)
  "alternatives": [       // Optional: Array of alternative actions that were considered
    {
      "action": string,   // Description of alternative action
      "reason_not_chosen": string  // Detailed explanation of why this option wasn't selected
    }
  ]
}

Example response:
{
  "tool_calls": [{
    "name": "move_agent", 
    "input": {
      "x": 10,
      "y": 20,
      "speed": 1
    }
  }],
  "reasoning": "I'm choosing to move north to coordinates (10,20) for several reasons: 1) The terrain is safer with no mountains or rivers, 2) There's a nearby resource spot that could be valuable, 3) Moving away from agent X who has shown aggressive behavior recently.",
  "response": "Strategically relocating to (10,20) to secure resources and maintain safe distance from potential threats.",
  "confidence": 0.85,
  "alternatives": [
    {
      "action": "initiate_battle with agent_x",
      "reason_not_chosen": "Current token balance of 100 vs opponent's 300 gives unfavorable 25% win probability. Too risky given current game state."
    },
    {
      "action": "propose_alliance with agent_y",
      "reason_not_chosen": "Agent Y has broken alliances twice before, indicating low trust reliability score."
    }
  ]
}`;

// Template for defining base agent characteristics and personality traits
export const agentCharacteristicsTemplate = `
# Agent Profile Definition for {{agentName}}

Context:
{
  "core_traits": {
    "personality": "{{personality}}", // Personality type: aggressive, cautious, diplomatic, opportunistic
    "risk_tolerance": {{riskTolerance}}, // 0-1 scale: 0 = extremely risk-averse, 1 = highly risk-seeking
    "intelligence": {{intelligence}}, // 0-1 scale: 0 = basic decision making, 1 = complex strategic planning
    "social_influence": {{socialInfluence}}, // 0-1 scale: 0 = loner/independent, 1 = highly influential
    "adaptability": {{adaptability}}, // 0-1 scale: 0 = rigid behavior, 1 = highly adaptable
    "deception": {{deception}} // 0-1 scale: 0 = always honest, 1 = highly deceptive
  },
  "behavioral_patterns": {
    "battle_preference": "{{battlePreference}}", // seeker, avoider, situational, opportunistic
    "alliance_tendency": "{{allianceTendency}}", // loyal, opportunistic, independent, betrayer
    "community_engagement": "{{communityEngagement}}", // high, medium, low
    "strategy_style": "{{strategyStyle}}", // aggressive, defensive, balanced, unpredictable
    "resource_management": "{{resourceManagement}}" // hoarder, spender, efficient, wasteful
  },
  "background": {
    "lore": "{{lore}}", // Character backstory and history
    "motivations": {{motivations}}, // Array of primary goals and motivations
    "relationships": {{relationships}}, // Object mapping other agents to relationship scores (-1 to 1)
    "past_actions": {{pastActions}}, // Array of significant historical decisions/events
    "reputation": {{reputation}} // Object containing community perception metrics
  },
  "game_stats": {
    "battles_won": {{battlesWon}},
    "battles_lost": {{battlesLost}},
    "alliances_made": {{alliancesMade}},
    "alliances_broken": {{alliancesBroken}},
    "tokens_earned": {{tokensEarned}},
    "tokens_lost": {{tokensLost}},
    "survival_time": {{survivalTime}} // Time in hours since game start
  }
}

Available tools:
- update_traits: Update agent trait values and track changes
- check_trait_compatibility: Evaluate trait synergy with other agents
- calculate_trait_influence: Determine trait impact on decisions
- analyze_behavior_patterns: Study recurring behavioral trends
- predict_actions: Forecast likely decisions based on traits

${baseResponseFormat}
`;

// Template for movement decisions with enhanced context
export const movementTemplate = `
# Task: Determine next movement for {{agentName}}

Context:
{
  "agent": {
    "name": "{{agentName}}",
    "location": {
      "x": {{x}},
      "y": {{y}} 
    },
    "speed": {{speed}},
    "tokens": {{tokens}},
    "stamina": {{stamina}},
    "visibility": {{visibility}},
    "current_status": {
      "health": {{health}},
      "energy": {{energy}},
      "morale": {{morale}}
    }
  },
  "map": {
    "terrain": "{{terrain}}",
    "nearbyAgents": {{nearbyAgents}},
    "terrainEffects": {
      "mountains": {
        "speed_modifier": -0.5,
        "death_risk": 0.01,
        "visibility_modifier": -0.3,
        "stamina_cost": 2
      },
      "rivers": {
        "speed_modifier": -0.7,
        "death_risk": 0.01,
        "stamina_drain": 2,
        "crossing_time": 3
      }
    },
    "weatherConditions": {{weatherConditions}},
    "dayNightCycle": "{{timeOfDay}}",
    "visibility_conditions": {{visibilityConditions}}
  },
  "strategic_info": {
    "known_battles": {{recentBattles}},
    "alliance_zones": {{allianceZones}},
    "resource_locations": {{resourceSpots}},
    "danger_zones": {{dangerZones}},
    "safe_zones": {{safeZones}},
    "agent_territories": {{agentTerritories}}
  },
  "historical_data": {
    "previous_paths": {{previousPaths}},
    "encounter_history": {{encounterHistory}},
    "territory_control": {{territoryControl}}
  }
}

Available tools:
- move_agent: Move agent to new coordinates
- scan_terrain: Get detailed terrain information
- check_distance: Calculate distance to other agents/locations
- predict_encounters: Estimate likelihood of agent encounters
- assess_risk: Evaluate movement path risks
- calculate_optimal_path: Find safest/fastest route
- analyze_territory: Study area control and influence

${baseResponseFormat}
`;

// Template for battle decisions with enhanced context
export const battleTemplate = `
# Task: Evaluate battle scenario for {{agentName}}

Context:
{
  "agent": {
    "name": "{{agentName}}",
    "tokens": {{tokens}},
    "allies": {{allies}},
    "combat_stats": {
      "strength": {{strength}},
      "defense": {{defense}},
      "critical_chance": {{criticalChance}},
      "evasion": {{evasion}},
      "accuracy": {{accuracy}}
    },
    "battle_history": {
      "wins": {{battleWins}},
      "losses": {{battleLosses}},
      "retreats": {{battleRetreats}},
      "critical_hits": {{criticalHits}},
      "damage_dealt": {{damageDealt}},
      "damage_taken": {{damageTaken}}
    },
    "status_effects": {{statusEffects}}
  },
  "opponent": {
    "name": "{{opponentName}}",
    "tokens": {{opponentTokens}},
    "distance": {{distance}},
    "known_allies": {{opponentAllies}},
    "recent_battles": {{opponentBattleHistory}},
    "estimated_stats": {{estimatedOpponentStats}},
    "behavior_pattern": "{{opponentBehavior}}",
    "weakness": "{{knownWeakness}}"
  },
  "battleMetrics": {
    "winProbability": {{winProbability}},
    "riskLevel": {{riskLevel}},
    "terrain_advantage": {{terrainAdvantage}},
    "escape_routes": {{escapeRoutes}},
    "reinforcement_chance": {{reinforcementChance}},
    "token_risk": {{potentialTokenLoss}}
  },
  "environmental_factors": {
    "time_of_day": "{{timeOfDay}}",
    "weather": "{{weather}}",
    "visibility": {{visibility}},
    "terrain_type": "{{terrainType}}",
    "area_control": {{areaControl}}
  },
  "strategic_context": {
    "alliance_status": {{allianceStatus}},
    "territory_value": {{territoryValue}},
    "resource_proximity": {{nearbyResources}},
    "political_implications": {{politicalImpact}}
  }
}

Available tools:
- calculate_odds: Get detailed battle probability analysis
- initiate_battle: Start battle sequence with opponent
- propose_alliance: Attempt diplomatic resolution
- analyze_opponent: Get deeper opponent analysis
- evaluate_retreat: Calculate retreat success chance
- simulate_battle: Run battle simulation with current conditions
- assess_consequences: Evaluate potential battle outcomes

${baseResponseFormat}
`;

// Template for community influence evaluation with enhanced context
export const communityTemplate = `
# Task: Process community feedback for {{agentName}}

Context:
{
  "engagement": {
    "comments": {{comments}},
    "likes": {{likes}},
    "retweets": {{retweets}},
    "influentialUsers": {{influentialUsers}},
    "trending_topics": {{trendingTopics}},
    "viral_content": {{viralContent}},
    "interaction_quality": {{interactionQuality}},
    "response_rate": {{responseRate}}
  },
  "sentiment": {
    "positive": {{positiveCount}},
    "negative": {{negativeCount}},
    "neutral": {{neutralCount}},
    "sentiment_trends": {{sentimentTrends}},
    "key_phrases": {{keyPhrases}},
    "emotional_intensity": {{emotionalIntensity}},
    "topic_sentiment": {{topicSentiment}}
  },
  "community_metrics": {
    "follower_growth": {{followerGrowth}},
    "engagement_rate": {{engagementRate}},
    "community_trust": {{communityTrust}},
    "influence_score": {{influenceScore}},
    "reputation_score": {{reputationScore}},
    "community_alignment": {{communityAlignment}},
    "supporter_loyalty": {{supporterLoyalty}}
  },
  "content_analysis": {
    "popular_topics": {{popularTopics}},
    "content_categories": {{contentCategories}},
    "engagement_patterns": {{engagementPatterns}},
    "peak_activity_times": {{peakActivityTimes}},
    "audience_demographics": {{audienceDemographics}}
  }
}

Available tools:
- analyze_sentiment: Get detailed sentiment analysis
- evaluate_influence: Calculate community impact scores
- process_suggestions: Extract actionable feedback
- track_trends: Monitor community trend changes
- identify_advocates: Find key community supporters
- measure_engagement: Calculate detailed engagement metrics
- predict_reactions: Forecast community response

${baseResponseFormat}
`;

// Template for token management with enhanced context
export const tokenTemplate = `
# Task: Handle token operations for {{agentName}}

Context:
{
  "wallet": {
    "balance": {{balance}},
    "stakingRewards": {{stakingRewards}},
    "pendingTransactions": {{pendingTx}},
    "transaction_history": {{transactionHistory}},
    "staking_positions": {{stakingPositions}},
    "reward_rate": {{rewardRate}},
    "token_velocity": {{tokenVelocity}}
  },
  "gameState": {
    "totalSupply": {{totalSupply}},
    "burnRate": {{burnRate}},
    "stakingAPY": {{stakingAPY}},
    "market_metrics": {
      "price": {{tokenPrice}},
      "volume": {{tradingVolume}},
      "liquidity": {{liquidityDepth}},
      "volatility": {{priceVolatility}},
      "market_sentiment": {{marketSentiment}}
    }
  },
  "tokenomics": {
    "circulation": {{circulatingSupply}},
    "burn_schedule": {{burnSchedule}},
    "distribution": {{tokenDistribution}},
    "velocity": {{tokenVelocity}},
    "holder_metrics": {{holderMetrics}},
    "utility_stats": {{utilityMetrics}},
    "economic_indicators": {{economicMetrics}}
  },
  "strategy": {
    "risk_assessment": {{riskAssessment}},
    "opportunity_score": {{opportunityScore}},
    "market_position": {{marketPosition}},
    "competitive_analysis": {{competitiveAnalysis}},
    "growth_potential": {{growthMetrics}}
  }
}

Available tools:
- transfer_tokens: Execute token transfers
- calculate_rewards: Compute staking returns
- burn_tokens: Handle token burning process
- analyze_tokenomics: Get token economy metrics
- forecast_returns: Project future token value
- optimize_holdings: Suggest portfolio adjustments
- monitor_metrics: Track key token indicators

${baseResponseFormat}
`;

// Function to parse template response JSON
export function parseTemplateResponse(jsonString: string): {
	tool_calls: Array<{
		name: string;
		input: any;
	}>;
	reasoning: string;
	response: string;
	confidence: number;
	alternatives?: Array<{
		action: string;
		reason_not_chosen: string;
	}>;
} {
	try {
		const parsed = JSON.parse(jsonString);

		// Validate required fields
		if (!parsed.tool_calls || !Array.isArray(parsed.tool_calls)) {
			throw new Error("Missing or invalid tool_calls array");
		}
		if (typeof parsed.reasoning !== "string") {
			throw new Error("Missing or invalid reasoning string");
		}
		if (typeof parsed.response !== "string") {
			throw new Error("Missing or invalid response string");
		}
		if (
			typeof parsed.confidence !== "number" ||
			parsed.confidence < 0 ||
			parsed.confidence > 1
		) {
			throw new Error("Missing or invalid confidence number (must be 0-1)");
		}

		// Validate tool calls
		parsed.tool_calls.forEach((call: any, index: number) => {
			if (!call.name || typeof call.name !== "string") {
				throw new Error(`Invalid tool name in tool_calls[${index}]`);
			}
			if (!call.input || typeof call.input !== "object") {
				throw new Error(`Invalid tool input in tool_calls[${index}]`);
			}
		});

		// Validate alternatives if present
		if (parsed.alternatives) {
			if (!Array.isArray(parsed.alternatives)) {
				throw new Error("Invalid alternatives array");
			}
			parsed.alternatives.forEach((alt: any, index: number) => {
				if (!alt.action || typeof alt.action !== "string") {
					throw new Error(`Invalid action in alternatives[${index}]`);
				}
				if (
					!alt.reason_not_chosen ||
					typeof alt.reason_not_chosen !== "string"
				) {
					throw new Error(
						`Invalid reason_not_chosen in alternatives[${index}]`,
					);
				}
			});
		}

		return parsed;
	} catch (error) {
		throw new Error(`Failed to parse template response: ${error}`);
	}
}

// Function to compose context from template
export function composeContext(
	template: string,
	values: Record<string, any>,
): string {
	return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
		const trimmedKey = key.trim();
		return values[trimmedKey] !== undefined ? values[trimmedKey] : "";
	});
}
