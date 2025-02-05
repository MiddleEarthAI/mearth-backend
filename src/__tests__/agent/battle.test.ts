import { ActionManager } from "@/agent/ActionManager";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { GameManager } from "@/agent/GameManager";
import { GameAction, MearthProgram } from "@/types";
import { Agent, Game, MapTile, PrismaClient } from "@prisma/client";
import { getProgramWithWallet } from "@/utils/program";
import { AgentAccount, GameAccount } from "@/types/program";
import { PublicKey } from "@solana/web3.js";

// Use actual Prisma client
export const prisma = new PrismaClient();
// Get actual testProgram instance
export let testProgram: MearthProgram;
export let activeGame: Game;
export let gameAccount: GameAccount;
export let agentsWithAccounts: Array<{
  account: AgentAccount;
  agent: Agent;
}>;

let defaultAgent: {
  account: AgentAccount;
  agent: Agent;
};

let targetAgent: {
  account: AgentAccount;
  agent: Agent;
};

export let agent1Pda: PublicKey;
export let agent2Pda: PublicKey;
export let agent3Pda: PublicKey;
export let agent4Pda: PublicKey;

/**
 * Battle Integration Test Suite
 * Tests all battle-related functionality in ActionManager
 */
describe("Battle Integration Tests", () => {
  let actionManager: ActionManager;
  let gameManager: GameManager;

  beforeAll(async () => {
    testProgram = await getProgramWithWallet();
    gameManager = new GameManager(testProgram, prisma);
    const result = await gameManager.createNewGame();
    if (!result) {
      throw new Error("No active game found");
    }
    const { dbGame, agents } = result;
    activeGame = dbGame;
    agentsWithAccounts = agents;
    defaultAgent = agentsWithAccounts[0];
    targetAgent = agentsWithAccounts[1];
    gameAccount = result.gameAccount;

    const [gamePda] = getGamePDA(testProgram.programId, dbGame.onchainId);
    agent1Pda = getAgentPDA(
      testProgram.programId,
      gamePda,
      agents[0].agent.onchainId
    )[0];
    agent2Pda = getAgentPDA(
      testProgram.programId,
      gamePda,
      agents[1].agent.onchainId
    )[0];
    agent3Pda = getAgentPDA(
      testProgram.programId,
      gamePda,
      agents[2].agent.onchainId
    )[0];
    agent4Pda = getAgentPDA(
      testProgram.programId,
      gamePda,
      agents[3].agent.onchainId
    )[0];

    // Initialize ActionManager with game context
    actionManager = new ActionManager(
      testProgram,
      activeGame.onchainId,
      prisma
    );
  });

  describe("Battle Initiation", () => {
    it("should initiate battle between adjacent agents", async () => {
      // Position agents adjacent to each other
      await prisma.mapTile.updateMany({
        where: {
          agentId: {
            in: [defaultAgent.agent.id, targetAgent.agent.id],
          },
        },
        data: {
          x: 10,
          y: 10,
        },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: targetAgent.agent.onchainId,
        tweet: "Initiating battle with adjacent agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(true);

      const battle = await prisma.battle.findFirst({
        where: {
          attackerId: defaultAgent.agent.id,
          defenderId: targetAgent.agent.id,
        },
      });
      expect(battle).toBeTruthy();
      expect(battle?.status).toBe("Active");
    });

    it("should prevent battle with non-adjacent agents", async () => {
      // Move target agent far away
      await prisma.mapTile.update({
        where: {
          id: targetAgent.agent.mapTileId,
        },
        data: {
          x: 100,
          y: 100,
        },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting battle with distant agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("range");
    });
  });

  describe("Battle Validation", () => {
    it("should prevent battle with dead agents", async () => {
      // Kill target agent
      await prisma.agent.update({
        where: { id: targetAgent.agent.id },
        data: { isAlive: false },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting battle with dead agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not alive");

      // Revive target agent for other tests
      await prisma.agent.update({
        where: { id: targetAgent.agent.id },
        data: { isAlive: true },
      });
    });

    it("should prevent battle with non-existent agent", async () => {
      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: 99999,
        tweet: "Attempting battle with non-existent agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not found");
    });

    it("should prevent battle during cooldown period", async () => {
      // Create a battle cooldown
      await prisma.coolDown.create({
        data: {
          type: "Battle",
          endsAt: new Date(Date.now() + 3600000), // 1 hour from now
          cooledAgentId: defaultAgent.agent.id,
          gameId: activeGame.id,
        },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting battle during cooldown",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("cooldown");
    });
  });

  describe("Battle with Alliances", () => {
    beforeEach(async () => {
      // Clean up existing alliances and battles
      await prisma.alliance.deleteMany();
      await prisma.battle.deleteMany();
    });

    it("should handle battle between allied agents", async () => {
      // Create an alliance
      await prisma.alliance.create({
        data: {
          initiatorId: defaultAgent.agent.id,
          joinerId: targetAgent.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting battle with allied agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("allied");
    });
  });
});
