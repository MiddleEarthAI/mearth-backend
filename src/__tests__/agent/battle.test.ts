import { ActionManager } from "@/agent/ActionManager";
import { GameAction } from "@/types";
import { testState, createTestAlliance } from "../setup";

/**
 * Battle Integration Test Suite
 * Tests all battle-related functionality in ActionManager
 */
describe("Battle Integration Tests", () => {
  let actionManager: ActionManager;

  beforeAll(() => {
    // Initialize ActionManager with game context
    actionManager = new ActionManager(
      testState.program!,
      testState.activeGame!.onchainId,
      testState.prisma
    );
  });

  describe("Battle Initiation", () => {
    it("should initiate battle between adjacent agents", async () => {
      // Position agents adjacent to each other
      await testState.prisma.mapTile.updateMany({
        where: {
          agentId: {
            in: [
              testState.agentsWithAccounts[0].agent.id,
              testState.agentsWithAccounts[1].agent.id,
            ],
          },
        },
        data: {
          x: 10,
          y: 10,
        },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Initiating battle with adjacent agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(true);

      const battle = await testState.prisma.battle.findFirst({
        where: {
          attackerId: testState.agentsWithAccounts[0].agent.id,
          defenderId: testState.agentsWithAccounts[1].agent.id,
        },
      });
      expect(battle).toBeTruthy();
      expect(battle?.status).toBe("Active");
    });

    it("should prevent battle with non-adjacent agents", async () => {
      // Move target agent far away
      const targetMapTile = await testState.prisma.mapTile.findFirst({
        where: {
          agentId: testState.agentsWithAccounts[1].agent.id,
        },
      });

      if (targetMapTile) {
        await testState.prisma.mapTile.update({
          where: { id: targetMapTile.id },
          data: {
            x: 100,
            y: 100,
          },
        });
      }

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting battle with distant agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
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
      await testState.prisma.agent.update({
        where: { id: testState.agentsWithAccounts[1].agent.id },
        data: { isAlive: false },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting battle with dead agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not alive");

      // Revive target agent for other tests
      await testState.prisma.agent.update({
        where: { id: testState.agentsWithAccounts[1].agent.id },
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
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not found");
    });

    it("should prevent battle during cooldown period", async () => {
      // Create a battle cooldown
      await testState.prisma.coolDown.create({
        data: {
          type: "Battle",
          endsAt: new Date(Date.now() + 3600000), // 1 hour from now
          cooledAgentId: testState.agentsWithAccounts[0].agent.id,
          gameId: testState.activeGame!.id,
        },
      });

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting battle during cooldown",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("cooldown");
    });
  });

  describe("Battle with Alliances", () => {
    it("should handle battle between allied agents", async () => {
      // Create an alliance
      await createTestAlliance(0, 1);

      const battleAction: GameAction = {
        type: "BATTLE",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting battle with allied agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        battleAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("allied");
    });
  });
});
