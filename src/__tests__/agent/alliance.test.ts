import { ActionManager } from "@/agent/ActionManager";
import { GameAction } from "@/types";
import { testState, createTestAlliance } from "../setup";

/**
 * Alliance Integration Test Suite
 * Tests all alliance-related functionality in ActionManager
 */
describe("Alliance Integration Tests", () => {
  let actionManager: ActionManager;

  beforeAll(() => {
    // Initialize ActionManager with game context
    actionManager = new ActionManager(
      testState.program!,
      testState.activeGame!.onchainId,
      testState.prisma
    );
  });

  describe("Alliance Formation", () => {
    it("should form alliance between eligible agents", async () => {
      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Proposing new alliance",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(true);

      const alliance = await testState.prisma.alliance.findFirst({
        where: {
          initiatorId: testState.agentsWithAccounts[0].agent.id,
          joinerId: testState.agentsWithAccounts[1].agent.id,
        },
      });
      expect(alliance).toBeTruthy();
      expect(alliance?.status).toBe("Active");
    });

    it("should prevent alliance with dead agents", async () => {
      // Kill target agent
      await testState.prisma.agent.update({
        where: { id: testState.agentsWithAccounts[1].agent.id },
        data: { isAlive: false },
      });

      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting alliance with dead agent",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("not alive");

      // Revive target agent for other tests
      await testState.prisma.agent.update({
        where: { id: testState.agentsWithAccounts[1].agent.id },
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
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
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
      await createTestAlliance(0, 1);

      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting duplicate alliance",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        allianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("already exists");
    });

    it("should prevent alliance during cooldown period", async () => {
      // Create alliance cooldown
      await testState.prisma.coolDown.create({
        data: {
          type: "Alliance",
          endsAt: new Date(Date.now() + 3600000), // 1 hour from now
          cooledAgentId: testState.agentsWithAccounts[0].agent.id,
          gameId: testState.activeGame!.id,
        },
      });

      const allianceAction: GameAction = {
        type: "ALLY",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting alliance during cooldown",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
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
      await testState.prisma.alliance.create({
        data: {
          initiatorId: testState.agentsWithAccounts[0].agent.id,
          joinerId: testState.agentsWithAccounts[1].agent.id,
          gameId: testState.activeGame!.id,
          status: "Broken",
          timestamp: new Date(),
          endedAt: new Date(),
        },
      });

      const newAllianceAction: GameAction = {
        type: "ALLY",
        targetId: testState.agentsWithAccounts[1].agent.onchainId,
        tweet: "Attempting alliance after previous break",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
        },
        newAllianceAction
      );
      expect(result.success).toBe(false);
      expect(result.feedback?.error?.message).toContain("cooldown");
    });

    it("should prevent multiple active alliances", async () => {
      // Create first alliance
      await createTestAlliance(0, 1);

      // Attempt second alliance
      const secondAllianceAction: GameAction = {
        type: "ALLY",
        targetId: testState.agentsWithAccounts[2].agent.onchainId,
        tweet: "Attempting second active alliance",
      };

      const result = await actionManager.executeAction(
        {
          gameId: testState.activeGame!.id,
          gameOnchainId: testState.activeGame!.onchainId,
          agentId: testState.agentsWithAccounts[0].agent.id,
          agentOnchainId: testState.agentsWithAccounts[0].agent.onchainId,
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
