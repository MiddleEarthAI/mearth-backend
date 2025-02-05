import { BattleResolver } from "@/agent/BattleResolver";
import { getAgentPDA, getGamePDA } from "@/utils/pda";
import { GameManager } from "@/agent/GameManager";
import { MearthProgram } from "@/types";
import { Agent, Game, PrismaClient } from "@prisma/client";
import { getProgramWithWallet } from "@/utils/program";
import { AgentAccount, GameAccount } from "@/types/program";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

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

let singleAgent: {
  account: AgentAccount;
  agent: Agent;
};

let allianceLeader: {
  account: AgentAccount;
  agent: Agent;
};

let alliancePartner: {
  account: AgentAccount;
  agent: Agent;
};

export let agent1Pda: PublicKey;
export let agent2Pda: PublicKey;
export let agent3Pda: PublicKey;
export let agent4Pda: PublicKey;

/**
 * Agent vs Alliance Battle Resolution Test Suite
 * Tests battle resolution between a single agent and an alliance
 */
describe("Agent vs Alliance Battle Resolution Tests", () => {
  let battleResolver: BattleResolver;
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
    singleAgent = agentsWithAccounts[0];
    allianceLeader = agentsWithAccounts[1];
    alliancePartner = agentsWithAccounts[2];
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

    // Initialize BattleResolver with game context
    battleResolver = new BattleResolver(
      activeGame.onchainId,
      activeGame.id,
      testProgram,
      prisma
    );
  });

  beforeEach(async () => {
    // Clean up existing battles and alliances before each test
    await prisma.battle.deleteMany();
    await prisma.alliance.deleteMany();
    // Reset agent health
    await prisma.agent.updateMany({
      data: { health: 100, isAlive: true },
    });
  });

  describe("Agent vs Alliance Battle Resolution", () => {
    it("should resolve battle between single agent and alliance", async () => {
      // Create alliance
      await prisma.alliance.create({
        data: {
          initiatorId: allianceLeader.agent.id,
          joinerId: alliancePartner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create battle
      const battle = await prisma.battle.create({
        data: {
          attackerId: singleAgent.agent.id,
          defenderId: allianceLeader.agent.id,
          defenderAllyId: alliancePartner.agent.id,
          status: "Active",
          type: "AgentVsAlliance",
          tokensStaked: 1000,
          startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
          gameId: activeGame.id,
        },
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resolvedBattle = await prisma.battle.findUnique({
        where: { id: battle.id },
      });

      expect(resolvedBattle).toBeTruthy();
      expect(resolvedBattle?.status).toBe("Resolved");
      expect(resolvedBattle?.endTime).toBeTruthy();
      expect(resolvedBattle?.winnerId).toBeTruthy();
    });

    it("should apply health penalties to losing side", async () => {
      // Create alliance
      await prisma.alliance.create({
        data: {
          initiatorId: allianceLeader.agent.id,
          joinerId: alliancePartner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create battle
      await prisma.battle.create({
        data: {
          attackerId: singleAgent.agent.id,
          defenderId: allianceLeader.agent.id,
          defenderAllyId: alliancePartner.agent.id,
          status: "Active",
          type: "AgentVsAlliance",
          tokensStaked: 1000,
          startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
          gameId: activeGame.id,
        },
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAgents = await prisma.agent.findMany({
        where: {
          id: {
            in: [
              singleAgent.agent.id,
              allianceLeader.agent.id,
              alliancePartner.agent.id,
            ],
          },
        },
      });

      // Either single agent or both alliance members should have reduced health
      const allianceHealth = updatedAgents.filter(
        (agent) =>
          agent.id === allianceLeader.agent.id ||
          agent.id === alliancePartner.agent.id
      );
      const singleAgentHealth = updatedAgents.find(
        (agent) => agent.id === singleAgent.agent.id
      );

      expect(
        allianceHealth.every((agent) => agent.health < 100) ||
          (singleAgentHealth && singleAgentHealth.health < 100)
      ).toBe(true);
    });

    it("should handle death of alliance members", async () => {
      // Set alliance members health low
      await prisma.agent.updateMany({
        where: {
          id: {
            in: [allianceLeader.agent.id, alliancePartner.agent.id],
          },
        },
        data: { health: 5 },
      });

      // Create alliance
      await prisma.alliance.create({
        data: {
          initiatorId: allianceLeader.agent.id,
          joinerId: alliancePartner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create battle
      await prisma.battle.create({
        data: {
          attackerId: singleAgent.agent.id,
          defenderId: allianceLeader.agent.id,
          defenderAllyId: alliancePartner.agent.id,
          status: "Active",
          type: "AgentVsAlliance",
          tokensStaked: 1000,
          startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
          gameId: activeGame.id,
        },
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAlliance = await prisma.agent.findMany({
        where: {
          id: {
            in: [allianceLeader.agent.id, alliancePartner.agent.id],
          },
        },
      });

      expect(updatedAlliance.some((agent) => !agent.isAlive)).toBe(true);
      expect(
        updatedAlliance.some((agent) => agent.deathTimestamp !== null)
      ).toBe(true);
    });
  });

  afterAll(async () => {
    battleResolver.stop();
  });
});
