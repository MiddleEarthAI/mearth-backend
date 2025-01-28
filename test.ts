const { isWithinMap, isValidMovement, isWithinTwoUnits } = require("./helpers");

const updateGameState = (_gameState, _decisions) => {
  const newGameState = JSON.parse(JSON.stringify(_gameState));
  const mapRadius = 60;
  const agents = Object.keys(newGameState);

  const updateRelationship = (agent, targetAgent, relationshipType) => {
    const agentKey = targetAgent.slice(-1);
    newGameState[agent][`rel${agentKey}`] = relationshipType;

    const targetKey = agent.slice(-1);
    newGameState[targetAgent][`rel${targetKey}`] = relationshipType;
  };

  agents.forEach((agent) => {
    const currentAgentState = newGameState[agent];
    const decision = _decisions[agent];
    const { targetPos, interaction, with: targetAgent } = decision;

    if (
      targetPos &&
      isWithinMap(mapRadius, targetPos) &&
      isValidMovement(currentAgentState.currentPos, targetPos)
    ) {
      newGameState[agent].currentPos = targetPos;
    }

    if (interaction && targetAgent) {
      const targetAgentDecision = _decisions[targetAgent];
      const targetAgentState = newGameState[targetAgent];
      const targetAgentKey = targetAgent.slice(-1);
      if (
        interaction === "alliance" &&
        newGameState[agent][`rel${targetAgentKey}`] !== "alliance"
      ) {
        if (
          targetAgentDecision?.interaction === "alliance" &&
          targetAgentDecision?.with === agent &&
          isWithinTwoUnits(targetPos, targetAgentDecision?.targetPos) &&
          isValidMovement(targetPos, targetAgentDecision?.targetPos)
        ) {
          updateRelationship(agent, targetAgent, "alliance");
        }
      }

      if (
        interaction === "battle" &&
        newGameState[agent][`rel${targetAgentKey}`] !== "battle"
      ) {
        if (
          newGameState[agent][`rel${targetAgentKey}`] !== "alliance" &&
          isWithinTwoUnits(targetPos, targetAgentDecision?.targetPos)
        ) {
          updateRelationship(agent, targetAgent, "battle");
        }
      }
    }
  });

  return newGameState;
};

module.exports = { updateGameState };
