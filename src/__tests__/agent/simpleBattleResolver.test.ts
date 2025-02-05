import { BattleResolver } from "@/agent/BattleResolver";
import { testState, createTestBattle, setAgentHealth } from "../setup";

/**
 * Simple Battle Resolution Test Suite
 * Tests 1v1 battle resolution functionality
 */
describe("Simple Battle Resolution Tests", () => {
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

  describe("Battle Resolution", () => {
    it("should resolve simple battle between two agents", async () => {
      // Create a battle between first two agents
      const battle = await createTestBattle(0, 1);

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

    it("should apply health penalties to losing agent", async () => {
      // Create a battle between first two agents
      await createTestBattle(0, 1);

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAgents = await testState.prisma.agent.findMany({
        where: {
          id: {
            in: [
              testState.agentsWithAccounts[0].agent.id,
              testState.agentsWithAccounts[1].agent.id,
            ],
          },
        },
      });

      // At least one agent should have reduced health
      expect(updatedAgents.some((agent) => agent.health < 100)).toBe(true);
    });

    it("should handle agent death when health reaches zero", async () => {
      // Set target agent health low
      await setAgentHealth(1, 5);

      // Create a battle
      await createTestBattle(0, 1);

      await battleResolver.start();

      // Wait for resolution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedAgent = await testState.prisma.agent.findUnique({
        where: { id: testState.agentsWithAccounts[1].agent.id },
      });

      expect(updatedAgent?.isAlive).toBe(false);
      expect(updatedAgent?.deathTimestamp).toBeTruthy();
    });

    it("should not resolve battles before cooldown period", async () => {
      // Create a recent battle
      const battle = await createTestBattle(0, 1, {
        startTime: new Date(), // Just started
      });

      await battleResolver.start();

      // Wait briefly
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const unresolvedBattle = await testState.prisma.battle.findUnique({
        where: { id: battle.id },
      });

      expect(unresolvedBattle?.status).toBe("Active");
      expect(unresolvedBattle?.endTime).toBeFalsy();
    });
  });

  afterAll(async () => {
    battleResolver.stop();
  });
});
