import { ActionManager } from "@/agent/ActionManager";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { GameManager } from "@/agent/GameManager";
import { GameAction, MearthProgram } from "@/types";
import { Agent, Game, PrismaClient } from "@prisma/client";
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
 * Alliance Integration Test Suite
 * Tests all alliance-related functionality in ActionManager
 */
describe("Alliance Integration Tests", () => {
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

  beforeEach(async () => {
    // Clean up existing alliances before each test
    await prisma.alliance.deleteMany();
  });

  describe("Alliance Formation", () => {
    it("should form alliance between eligible agents", async () => {
      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: targetAgent.agent.onchainId,
        tweet: "Proposing new alliance",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(true);

      const alliance = await prisma.alliance.findFirst({
        where: {
          initiatorId: defaultAgent.agent.id,
          joinerId: targetAgent.agent.id,
        },
      });
      expect(alliance).toBeTruthy();
      expect(alliance?.status).toBe("Active");
    });

    it("should prevent alliance with dead agents", async () => {
      // Kill target agent
      await prisma.agent.update({
        where: { id: targetAgent.agent.id },
        data: { isAlive: false },
      });

      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting alliance with dead agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not alive");

      // Revive target agent for other tests
      await prisma.agent.update({
        where: { id: targetAgent.agent.id },
        data: { isAlive: true },
      });
    });

    it("should prevent alliance with non-existent agent", async () => {
      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: 99999,
        tweet: "Attempting alliance with non-existent agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not found");
    });
  });

  describe("Alliance Restrictions", () => {
    it("should prevent duplicate alliances", async () => {
      // Create existing alliance
      await prisma.alliance.create({
        data: {
          initiatorId: defaultAgent.agent.id,
          joinerId: targetAgent.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting duplicate alliance",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("already exists");
    });

    it("should prevent alliance during cooldown period", async () => {
      // Create alliance cooldown
      await prisma.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(Date.now() + 3600000), // 1 hour from now
          cooledAgentId: defaultAgent.agent.id,
          gameId: activeGame.id,
        },
      });

      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting alliance during cooldown",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("cooldown");
    });
  });

  describe("Alliance Status Management", () => {
    it("should handle broken alliances correctly", async () => {
      // Create and then break alliance
      await prisma.alliance.create({
        data: {
          initiatorId: defaultAgent.agent.id,
          joinerId: targetAgent.agent.id,
          gameId: activeGame.id,
          status: "Broken",
          timestamp: new Date(),
          endedAt: new Date(),
        },
      });

      const newAllianceAction: GameAction = {
        type: "ALLY",
        targetId: targetAgent.agent.onchainId,
        tweet: "Attempting alliance after previous break",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        newAllianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("cooldown");
    });

    it("should prevent multiple active alliances", async () => {
      // Create first alliance
      await prisma.alliance.create({
        data: {
          initiatorId: defaultAgent.agent.id,
          joinerId: agentsWithAccounts[1].agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Attempt second alliance
      const secondAllianceAction: GameAction = {
        type: "ALLY",
        targetId: agentsWithAccounts[2].agent.onchainId,
        tweet: "Attempting second active alliance",
      };

      const result = await actionManager.executeAction(
        {
          gameId: activeGame.id,
          gameOnchainId: activeGame.onchainId,
          agentId: defaultAgent.agent.id,
          agentOnchainId: defaultAgent.agent.onchainId,
        },
        secondAllianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain(
        "already has an active alliance"
      );
    });
  });
});
