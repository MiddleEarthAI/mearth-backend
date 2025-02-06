import { BattleResolver } from "@/agent/BattleResolver";
import {
  testState,
  createTestBattle,
  createTestAlliance,
  setAgentHealth,
} from "../setup";

/**
 * Agent vs Alliance Battle Resolution Test Suite
 * Tests battle resolution between a single agent and an alliance
 */
describe("Agent vs Alliance Battle Resolution Tests", () => {
  let battleResolver: BattleResolver;

  beforeAll(() => {
    // Initialize BattleResolver with game context
    battleResolver = new BattleResolver(
      testState.activeGame!.onchainId,
      testState.activeGame!.id,
      testState.program!,
      testState.prisma
    );
  });

  describe("Agent vs Alliance Battle Resolution", () => {
    it("should resolve battle between single agent and alliance", async () => {
      // Create alliance between agents 1 and 2
      await createTestAlliance(1, 2);

      // Create battle between agent 0 and the alliance
      const battle = await createTestBattle(0, 1, {
        type: "AgentVsAlliance",
        defenderAllyIndex: 2,
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resolvedBattle = await testState.prisma.battle.findUnique({
        where: { id: battle.id },
      });

      expect(resolvedBattle).toBeTruthy();
      expect(resolvedBattle?.status).toBe("Resolved");
      expect(resolvedBattle?.endTime).toBeTruthy();
      expect(resolvedBattle?.winnerId).toBeTruthy();
    });

    it("should apply health penalties to losing side", async () => {
      // Create alliance between agents 1 and 2
      await createTestAlliance(1, 2);

      // Create battle between agent 0 and the alliance
      await createTestBattle(0, 1, {
        type: "AgentVsAlliance",
        defenderAllyIndex: 2,
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAgents = await testState.prisma.agent.findMany({
        where: {
          id: {
            in: [
              testState.agentsWithAccounts[0].agent.id,
              testState.agentsWithAccounts[1].agent.id,
              testState.agentsWithAccounts[2].agent.id,
            ],
          },
        },
      });

      // Either single agent or both alliance members should have reduced health
      const allianceHealth = updatedAgents.filter(
        (agent) =>
          agent.id === testState.agentsWithAccounts[1].agent.id ||
          agent.id === testState.agentsWithAccounts[2].agent.id
      );
      const singleAgentHealth = updatedAgents.find(
        (agent) => agent.id === testState.agentsWithAccounts[0].agent.id
      );

      expect(
        allianceHealth.every((agent) => agent.health < 100) ||
          (singleAgentHealth && singleAgentHealth.health < 100)
      ).toBe(true);
    });

    it("should handle death of alliance members", async () => {
      // Set alliance members health low
      await setAgentHealth(1, 5);
      await setAgentHealth(2, 5);

      // Create alliance between agents 1 and 2
      await createTestAlliance(1, 2);

      // Create battle between agent 0 and the alliance
      await createTestBattle(0, 1, {
        type: "AgentVsAlliance",
        defenderAllyIndex: 2,
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAlliance = await testState.prisma.agent.findMany({
        where: {
          id: {
            in: [
              testState.agentsWithAccounts[1].agent.id,
              testState.agentsWithAccounts[2].agent.id,
            ],
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
