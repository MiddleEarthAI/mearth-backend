import { jest } from "@jest/globals";
import { Agent, Game, PrismaClient } from "@prisma/client";
import { MearthProgram } from "@/types";
import * as dotenv from "dotenv";
import { getProgramWithWallet } from "@/utils/program";
import { GameManager } from "@/agent/GameManager";
import { AgentAccount, GameAccount } from "@/types/program";
import { PublicKey } from "@solana/web3.js";
import { getAgentPDA, getGamePDA } from "@/utils/pda";

dotenv.config();

// Shared test state
export const testState = {
  prisma: new PrismaClient(),
  program: null as MearthProgram | null,
  activeGame: null as Game | null,
  gameAccount: null as GameAccount | null,
  agentsWithAccounts: [] as Array<{
    account: AgentAccount;
    agent: Agent;
  }>,
  agent1Pda: null as PublicKey | null,
  agent2Pda: null as PublicKey | null,
  agent3Pda: null as PublicKey | null,
  agent4Pda: null as PublicKey | null,
};

/**
 * Initialize test environment with a new game and agents
 */
export async function initializeTestEnvironment() {
  testState.program = await getProgramWithWallet();
  const gameManager = new GameManager(testState.program, testState.prisma);
  const result = await gameManager.createNewGame();

  if (!result) {
    throw new Error("Failed to create new game for tests");
  }

  const { dbGame, agents, gameAccount } = result;
  testState.activeGame = dbGame;
  testState.agentsWithAccounts = agents;
  testState.gameAccount = gameAccount;

  const [gamePda] = getGamePDA(testState.program.programId, dbGame.onchainId);

  // Initialize agent PDAs
  testState.agent1Pda = getAgentPDA(
    testState.program.programId,
    gamePda,
    agents[0].agent.onchainId
  )[0];
  testState.agent2Pda = getAgentPDA(
    testState.program.programId,
    gamePda,
    agents[1].agent.onchainId
  )[0];
  testState.agent3Pda = getAgentPDA(
    testState.program.programId,
    gamePda,
    agents[2].agent.onchainId
  )[0];
  testState.agent4Pda = getAgentPDA(
    testState.program.programId,
    gamePda,
    agents[3].agent.onchainId
  )[0];
}

/**
 * Reset the database state
 */
export async function resetTestState() {
  await testState.prisma.$transaction([
    testState.prisma.coolDown.deleteMany(),
    testState.prisma.battle.deleteMany(),
    testState.prisma.alliance.deleteMany(),
    testState.prisma.agent.updateMany({
      data: { health: 100, isAlive: true },
    }),
  ]);
}

/**
 * Clean up test environment
 */
export async function cleanupTestEnvironment() {
  await testState.prisma.$disconnect();
}

// Setup before all tests
beforeAll(async () => {
  await initializeTestEnvironment();
});

// Cleanup after all tests
afterAll(async () => {
  await cleanupTestEnvironment();
});

// Reset state between tests
afterEach(async () => {
  await resetTestState();
});

// Global test timeout
jest.setTimeout(30000); // 30 seconds

// Export commonly used test utilities
export const getTestAgent = (index: number) =>
  testState.agentsWithAccounts[index];

export const createTestAlliance = async (
  initiatorIndex: number,
  joinerIndex: number
) => {
  const initiator = getTestAgent(initiatorIndex);
  const joiner = getTestAgent(joinerIndex);

  return testState.prisma.alliance.create({
    data: {
      initiatorId: initiator.agent.id,
      joinerId: joiner.agent.id,
      gameId: testState.activeGame!.id,
      status: "Active",
      timestamp: new Date(),
    },
  });
};

export const createTestBattle = async (
  attackerIndex: number,
  defenderIndex: number,
  options: {
    type?: "Simple" | "AgentVsAlliance" | "AllianceVsAlliance";
    attackerAllyIndex?: number;
    defenderAllyIndex?: number;
    tokensStaked?: number;
    startTime?: Date;
  } = {}
) => {
  const attacker = getTestAgent(attackerIndex);
  const defender = getTestAgent(defenderIndex);
  const attackerAlly =
    options.attackerAllyIndex !== undefined
      ? getTestAgent(options.attackerAllyIndex)
      : undefined;
  const defenderAlly =
    options.defenderAllyIndex !== undefined
      ? getTestAgent(options.defenderAllyIndex)
      : undefined;

  return testState.prisma.battle.create({
    data: {
      attackerId: attacker.agent.id,
      defenderId: defender.agent.id,
      attackerAllyId: attackerAlly?.agent.id,
      defenderAllyId: defenderAlly?.agent.id,
      status: "Active",
      type: options.type || "Simple",
      tokensStaked: options.tokensStaked || 1000,
      startTime: options.startTime || new Date(Date.now() - 3600000), // Default 1 hour ago
      gameId: testState.activeGame!.id,
    },
  });
};

export const setAgentHealth = async (agentIndex: number, health: number) => {
  const agent = getTestAgent(agentIndex);
  return testState.prisma.agent.update({
    where: { id: agent.agent.id },
    data: { health },
  });
};
