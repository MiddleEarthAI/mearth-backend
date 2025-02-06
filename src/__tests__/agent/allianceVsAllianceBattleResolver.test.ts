import { BattleResolver } from "@/agent/BattleResolver";
import {
  testState,
  createTestBattle,
  createTestAlliance,
  setAgentHealth,
} from "../setup";

/**
 * Alliance vs Alliance Battle Resolution Test Suite
 * Tests battle resolution between two alliances
 */
describe("Alliance vs Alliance Battle Resolution Tests", () => {
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

  describe("Alliance vs Alliance Battle Resolution", () => {
    it("should resolve battle between two alliances", async () => {
      // Create first alliance between agents 0 and 1
      await createTestAlliance(0, 1);

      // Create second alliance between agents 2 and 3
      await createTestAlliance(2, 3);

      // Create battle between the alliances
      const battle = await createTestBattle(0, 2, {
        type: "AllianceVsAlliance",
        attackerAllyIndex: 1,
        defenderAllyIndex: 3,
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

    it("should apply health penalties to losing alliance", async () => {
      // Create first alliance between agents 0 and 1
      await createTestAlliance(0, 1);

      // Create second alliance between agents 2 and 3
      await createTestAlliance(2, 3);

      // Create battle between the alliances
      await createTestBattle(0, 2, {
        type: "AllianceVsAlliance",
        attackerAllyIndex: 1,
        defenderAllyIndex: 3,
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
              testState.agentsWithAccounts[3].agent.id,
            ],
          },
        },
      });

      // Either alliance A or alliance B should have reduced health
      const allianceAHealth = updatedAgents.filter(
        (agent) =>
          agent.id === testState.agentsWithAccounts[0].agent.id ||
          agent.id === testState.agentsWithAccounts[1].agent.id
      );
      const allianceBHealth = updatedAgents.filter(
        (agent) =>
          agent.id === testState.agentsWithAccounts[2].agent.id ||
          agent.id === testState.agentsWithAccounts[3].agent.id
      );

      expect(
        allianceAHealth.every((agent) => agent.health < 100) ||
          allianceBHealth.every((agent) => agent.health < 100)
      ).toBe(true);
    });

    it("should handle death of alliance members", async () => {
      // Set alliance B members health low
      await setAgentHealth(2, 5);
      await setAgentHealth(3, 5);

      // Create first alliance between agents 0 and 1
      await createTestAlliance(0, 1);

      // Create second alliance between agents 2 and 3
      await createTestAlliance(2, 3);

      // Create battle between the alliances
      await createTestBattle(0, 2, {
        type: "AllianceVsAlliance",
        attackerAllyIndex: 1,
        defenderAllyIndex: 3,
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const allianceB = await testState.prisma.agent.findMany({
        where: {
          id: {
            in: [
              testState.agentsWithAccounts[2].agent.id,
              testState.agentsWithAccounts[3].agent.id,
            ],
          },
        },
      });

      expect(allianceB.some((agent) => !agent.isAlive)).toBe(true);
      expect(allianceB.some((agent) => agent.deathTimestamp !== null)).toBe(
        true
      );
    });

    it("should handle partial alliance death", async () => {
      // Set only one alliance member's health low
      await setAgentHealth(2, 5);
      await setAgentHealth(3, 50);

      // Create first alliance between agents 0 and 1
      await createTestAlliance(0, 1);

      // Create second alliance between agents 2 and 3
      await createTestAlliance(2, 3);

      // Create battle between the alliances
      await createTestBattle(0, 2, {
        type: "AllianceVsAlliance",
        attackerAllyIndex: 1,
        defenderAllyIndex: 3,
      });

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const allianceB = await testState.prisma.agent.findMany({
        where: {
          id: {
            in: [
              testState.agentsWithAccounts[2].agent.id,
              testState.agentsWithAccounts[3].agent.id,
            ],
          },
        },
      });

      const deadAgent = allianceB.find((agent) => !agent.isAlive);
      const survivingAgent = allianceB.find((agent) => agent.isAlive);

      expect(deadAgent).toBeTruthy();
      expect(survivingAgent).toBeTruthy();
      expect(deadAgent?.deathTimestamp).toBeTruthy();
      expect(survivingAgent?.health).toBeLessThan(100);
    });
  });

  afterAll(async () => {
    battleResolver.stop();
  });
});
