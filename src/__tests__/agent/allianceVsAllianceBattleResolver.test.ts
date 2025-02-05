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

let alliance1Leader: {
  account: AgentAccount;
  agent: Agent;
};

let alliance1Partner: {
  account: AgentAccount;
  agent: Agent;
};

let alliance2Leader: {
  account: AgentAccount;
  agent: Agent;
};

let alliance2Partner: {
  account: AgentAccount;
  agent: Agent;
};

export let agent1Pda: PublicKey;
export let agent2Pda: PublicKey;
export let agent3Pda: PublicKey;
export let agent4Pda: PublicKey;

/**
 * Alliance vs Alliance Battle Resolution Test Suite
 * Tests battle resolution between two alliances
 */
describe("Alliance vs Alliance Battle Resolution Tests", () => {
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
    alliance1Leader = agentsWithAccounts[0];
    alliance1Partner = agentsWithAccounts[1];
    alliance2Leader = agentsWithAccounts[2];
    alliance2Partner = agentsWithAccounts[3];
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

  describe("Alliance vs Alliance Battle Resolution", () => {
    it("should resolve battle between two alliances", async () => {
      // Create first alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance1Leader.agent.id,
          joinerId: alliance1Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create second alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance2Leader.agent.id,
          joinerId: alliance2Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create battle
      const battle = await prisma.battle.create({
        data: {
          attackerId: alliance1Leader.agent.id,
          attackerAllyId: alliance1Partner.agent.id,
          defenderId: alliance2Leader.agent.id,
          defenderAllyId: alliance2Partner.agent.id,
          status: "Active",
          type: "AllianceVsAlliance",
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

    it("should apply health penalties to losing alliance", async () => {
      // Create first alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance1Leader.agent.id,
          joinerId: alliance1Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create second alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance2Leader.agent.id,
          joinerId: alliance2Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create battle
      await prisma.battle.create({
        data: {
          attackerId: alliance1Leader.agent.id,
          attackerAllyId: alliance1Partner.agent.id,
          defenderId: alliance2Leader.agent.id,
          defenderAllyId: alliance2Partner.agent.id,
          status: "Active",
          type: "AllianceVsAlliance",
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
              alliance1Leader.agent.id,
              alliance1Partner.agent.id,
              alliance2Leader.agent.id,
              alliance2Partner.agent.id,
            ],
          },
        },
      });

      // One alliance should have reduced health
      const alliance1Health = updatedAgents.filter(
        (agent) =>
          agent.id === alliance1Leader.agent.id ||
          agent.id === alliance1Partner.agent.id
      );
      const alliance2Health = updatedAgents.filter(
        (agent) =>
          agent.id === alliance2Leader.agent.id ||
          agent.id === alliance2Partner.agent.id
      );

      expect(
        alliance1Health.every((agent) => agent.health < 100) ||
          alliance2Health.every((agent) => agent.health < 100)
      ).toBe(true);
    });

    it("should handle death of entire alliance", async () => {
      // Set alliance2 members health low
      await prisma.agent.updateMany({
        where: {
          id: {
            in: [alliance2Leader.agent.id, alliance2Partner.agent.id],
          },
        },
        data: { health: 5 },
      });

      // Create first alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance1Leader.agent.id,
          joinerId: alliance1Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create second alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance2Leader.agent.id,
          joinerId: alliance2Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create battle
      await prisma.battle.create({
        data: {
          attackerId: alliance1Leader.agent.id,
          attackerAllyId: alliance1Partner.agent.id,
          defenderId: alliance2Leader.agent.id,
          defenderAllyId: alliance2Partner.agent.id,
          status: "Active",
          type: "AllianceVsAlliance",
          tokensStaked: 1000,
          startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
          gameId: activeGame.id,
        },
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAlliance2 = await prisma.agent.findMany({
        where: {
          id: {
            in: [alliance2Leader.agent.id, alliance2Partner.agent.id],
          },
        },
      });

      expect(updatedAlliance2.every((agent) => !agent.isAlive)).toBe(true);
      expect(
        updatedAlliance2.every((agent) => agent.deathTimestamp !== null)
      ).toBe(true);
    });

    it("should handle partial alliance death", async () => {
      // Set only alliance2 leader health low
      await prisma.agent.update({
        where: { id: alliance2Leader.agent.id },
        data: { health: 5 },
      });

      // Create first alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance1Leader.agent.id,
          joinerId: alliance1Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create second alliance
      await prisma.alliance.create({
        data: {
          initiatorId: alliance2Leader.agent.id,
          joinerId: alliance2Partner.agent.id,
          gameId: activeGame.id,
          status: "Active",
          timestamp: new Date(),
        },
      });

      // Create battle
      await prisma.battle.create({
        data: {
          attackerId: alliance1Leader.agent.id,
          attackerAllyId: alliance1Partner.agent.id,
          defenderId: alliance2Leader.agent.id,
          defenderAllyId: alliance2Partner.agent.id,
          status: "Active",
          type: "AllianceVsAlliance",
          tokensStaked: 1000,
          startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
          gameId: activeGame.id,
        },
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAlliance2 = await prisma.agent.findMany({
        where: {
          id: {
            in: [alliance2Leader.agent.id, alliance2Partner.agent.id],
          },
        },
      });

      const deadLeader = updatedAlliance2.find(
        (agent) => agent.id === alliance2Leader.agent.id
      );
      const livingPartner = updatedAlliance2.find(
        (agent) => agent.id === alliance2Partner.agent.id
      );

      expect(deadLeader?.isAlive).toBe(false);
      expect(deadLeader?.deathTimestamp).toBeTruthy();
      expect(livingPartner?.isAlive).toBe(true);
      expect(livingPartner?.deathTimestamp).toBeNull();
    });
  });

  afterAll(async () => {
    battleResolver.stop();
  });
});
