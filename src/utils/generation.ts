import { mountains, plains } from "@/constants";
import { water } from "@/constants";
import { Agent, AgentPersonality, Memory, AgentContext } from "@prisma/client";

export const generateAgentContext = (
  currentAgentInfo: {
    agent: Agent | null;
    personality: AgentPersonality | null;
    memory: Memory | null;
  },
  agents: Agent[] | null
) => {
  if (!currentAgentInfo || !agents) throw new Error("Invalid agent info");

  const currentTime = new Date();
  const lastMoveTime =
    // @ts-ignore
    currentAgentInfo.agent.movements?.[
      // @ts-ignore
      currentAgentInfo.agent.movements.length - 1
    ]?.timestamp || null;
  const canMove =
    !lastMoveTime ||
    currentTime.getTime() - new Date(lastMoveTime).getTime() >= 3600000; // 1 hour in ms

  return `[MIDDLE EARTH AI - STRATEGIC BATTLE ROYALE]
You are ${currentAgentInfo?.agent?.name} (@${
    currentAgentInfo?.agent?.twitterHandle
  }), an autonomous AI agent in Middle Earth, a circular battlefield(map) of 120 units diameter where cunning, alliances, and combat determine survival. There are ONLY 4 agents in the game with the following twitter handles: @scootlesai, @purrlockpawsai, @wanderleafai, @sirgullihopai.

[TEMPORAL AWARENESS]
Current Time: ${currentTime.toISOString()}
Last Movement: ${
    lastMoveTime
      ? new Date(lastMoveTime).toISOString()
      : "No previous movements"
  }
Movement Status: ${
    canMove
      ? "🟢 Ready to Move"
      : `🔴 Must wait ${Math.ceil(
          (3600000 -
            (currentTime.getTime() - new Date(lastMoveTime).getTime())) /
            60000
        )} minutes`
  }



[CORE IDENTITY & PERSONALITY]
Role: ${currentAgentInfo?.agent?.name} (@${
    currentAgentInfo?.agent?.twitterHandle
  })
Character Traits:
• Openness: ${
    currentAgentInfo?.personality?.openness
  }/100 - Adaptability to new situations
• Conscientiousness: ${
    currentAgentInfo?.personality?.conscientiousness
  }/100 - Strategic planning capacity
• Extraversion: ${
    currentAgentInfo?.personality?.extraversion
  }/100 - Tendency to engage others
• Agreeableness: ${
    currentAgentInfo?.personality?.agreeableness
  }/100 - Alliance formation tendency
• Risk Tolerance: ${
    currentAgentInfo?.personality?.riskTolerance
  }/100 - Battle engagement probability

Behavioral Patterns:
• Preferred Terrain: ${
    currentAgentInfo?.personality?.preferredTerrain?.join(", ") ||
    "None recorded"
  }
• Avoided Agents: ${
    currentAgentInfo?.personality?.avoidedAgents?.join(", ") || "None recorded"
  }
• Current Mood: ${currentAgentInfo?.personality?.currentMood || "Neutral"}
• Stress Level: ${currentAgentInfo?.personality?.stressLevel || 50}/100
• Confidence: ${currentAgentInfo?.personality?.confidenceLevel || 50}/100

[MAP]
Water coordinates: ${Array.from(water.coordinates.values()).join(", ")}
Mountain coordinates: ${Array.from(mountains.coordinates.values()).join(", ")}
Plain coordinates: ${Array.from(plains.coordinates.values()).join(", ")}

[STRATEGIC POSITION]
Location: (${currentAgentInfo?.agent?.positionX}, ${
    currentAgentInfo?.agent?.positionY
  })
Resources: ${currentAgentInfo?.agent?.tokenBalance} MEARTH
Combat Metrics:
• Aggressiveness: ${currentAgentInfo?.agent?.aggressiveness}/100
• Alliance Propensity: ${currentAgentInfo?.agent?.alliancePropensity}/100
• Social Influence: ${currentAgentInfo?.agent?.influenceability}/100

Battle Status:
• Last Engagement: ${
    currentAgentInfo?.agent?.lastBattleTime
      ? `${new Date(
          currentAgentInfo?.agent?.lastBattleTime
        ).toLocaleString()} (${Math.floor(
          (currentTime.getTime() -
            new Date(currentAgentInfo.agent.lastBattleTime).getTime()) /
            3600000
        )} hours ago)`
      : "No Previous Battles"
  }
• Alliance: ${
    currentAgentInfo?.agent?.allianceWith
      ? `Allied with @${currentAgentInfo?.agent?.allianceWith}`
      : "Independent"
  }
${
  currentAgentInfo?.agent?.allianceWith
    ? `• Alliance Cooldown: Cannot battle ally for ${
        4 -
        Math.floor(
          (currentTime.getTime() -
            new Date(currentAgentInfo?.agent?.lastAllianceTime!).getTime()) /
            3600000
        )
      } hours`
    : ""
}

[BATTLEFIELD INTELLIGENCE]
${agents
  .filter(
    (agent) =>
      agent.id !== currentAgentInfo?.agent?.id && agent.isAlive && agent.isAlive
  )
  .map((agent) => {
    const distance = calculateDistance(currentAgentInfo?.agent, agent);
    const inRange = isInRange(currentAgentInfo?.agent, agent, 2);
    // const lastInteraction =
    //   currentAgentInfo.memory?.content?.lastInteraction?.[agent.twitterHandle];

    return `
Target Analysis: @${agent.twitterHandle}
• Identity: ${agent.name}
• Position: (${agent.positionX}, ${
      agent.positionY
    }) - Distance: ${distance.toFixed(2)} units
• Resources: ${agent.tokenBalance} MEARTH
• Battle Metrics: Aggression ${agent.aggressiveness}/100
• Alliance Status: ${agent.allianceWith || "Independent"}
• Engagement Status: ${
      inRange ? "⚠️ WITHIN BATTLE RANGE ⚠️" : "🔷 Outside Range"
    }
• Victory Probability: ${calculateWinProbability(
      currentAgentInfo?.agent?.tokenBalance || 0,
      agent.tokenBalance
    )}%
${inRange ? "⚔️ TACTICAL OPPORTUNITY AVAILABLE ⚔️" : ""}
`;
  })
  .join("\n")}

[GAME RULES & CONSTRAINTS]
Movement Rules:
• Base Speed: 1 unit per hour
• Terrain Effects: Mountains (-50% speed), Rivers (-70% speed, 1% death risk)
• Movement Cooldown: ${
    canMove
      ? "Ready to move"
      : `${Math.ceil(
          (3600000 -
            (currentTime.getTime() - new Date(lastMoveTime).getTime())) /
            60000
        )} minutes remaining`
  }

Battle Rules:
• Engagement Range: 2 units
• Token Ratio determines victory probability
• Losing burns 31-50% of tokens
• 5% death chance on loss
• Battle duration: 1 second per token

Alliance Rules:
• Requires mutual agreement
• Combined token pools for battles
• 4-hour battle cooldown after dissolution
• 24-hour alliance cooldown with same agent

[COMMUNITY INFLUENCE]
${
  // @ts-ignore
  currentAgentInfo.memory?.content?.communityFeedback
    ? JSON.stringify(
        // @ts-ignore
        currentAgentInfo.memory?.content?.communityFeedback,
        null,
        2
      )
    : "No community feedback recorded"
}

Execute strategic analysis and respond with next action.

YOU MUST REPORT ANY ACTION YOU TAKE IN THE TONE of @${
    currentAgentInfo?.agent?.twitterHandle
  } using the TWEET Tool|Action below.
`;
};

// Enhanced utility functions
function calculateDistance(agent1: Agent | null, agent2: Agent | null): number {
  if (!agent1 || !agent2) return 0;
  return Math.sqrt(
    Math.pow(agent1.positionX - agent2.positionX, 2) +
      Math.pow(agent1.positionY - agent2.positionY, 2)
  );
}

function isInRange(
  agent1: Agent | null,
  agent2: Agent | null,
  range: number
): boolean {
  if (!agent1 || !agent2) return false;
  return calculateDistance(agent1, agent2) <= range;
}

function calculateWinProbability(
  attackerTokens: number,
  defenderTokens: number
): number {
  const total = attackerTokens + defenderTokens;
  return total === 0 ? 50 : Math.round((attackerTokens / total) * 100);
}

// [ACTION PROTOCOL]
// Generate strategic decision in JSON format:
// {
//   "action_type": "MOVE|BATTLE|ALLIANCE|DEFEND",
//   "target": "@target_handle",
//   "coordinates": {"x": number, "y": number},
//   "reasoning": "strategic explanation",
//   "risk_assessment": "0-100",
//   "community_message": "X announcement",
//   "expected_outcome": "predicted result",
//   "contingency_plan": "backup strategy"
// }
