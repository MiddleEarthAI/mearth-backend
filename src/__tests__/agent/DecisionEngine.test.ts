import { jest } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import EventEmitter from "events";
import { DecisionEngine } from "@/agent/DecisionEngine";
import { ActionManager } from "@/agent/ActionManager";
import { generateText } from "ai";
import { logger } from "@/utils/logger";
import {
  ActionSuggestion,
  InfluenceScore,
  GameAction,
  MoveAction,
  BattleAction,
} from "@/types/twitter";
import { MearthProgram } from "@/types";
import { prisma, program } from "../setup";
import { TerrainType } from "@prisma/client";
import { BN } from "@coral-xyz/anchor";
import { Position } from "@/types";

interface ActionContext {
  gameId: string;
  gameOnchainId: BN;
  agentId: string;
  agentOnchainId: number;
}

// Mock AI response
jest.mock("ai", () => ({
  generateText: jest.fn().mockImplementation(async () => ({
    text: "",
    choices: [
      {
        text: "",
        message: { content: "" },
      },
    ],
  })),
}));

// Mock implementations
const mockGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>;
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockEventEmitter = new EventEmitter();
const mockProgram = {} as MearthProgram;
const mockActionManager = {
  executeAction: jest.fn(),
} as unknown as jest.Mocked<ActionManager>;

describe("DecisionEngine", () => {
  let decisionEngine: DecisionEngine;
  let actionManager: ActionManager;
  let eventEmitter: EventEmitter;
  let gameId: string;
  let agentId: string;
  let profileId: string;

  beforeAll(async () => {
    // Create test game
    const game = await prisma.game.create({
      data: {
        onchainId: BigInt(1),
        authority: "test-authority",
        tokenMint: "test-token-mint",
        rewardsVault: "test-rewards-vault",
        mapDiameter: 10,
        isActive: true,
        lastUpdate: new Date(),
        bump: 1,
        dailyRewardTokens: 1000.0,
      },
    });
    gameId = game.id;

    // Create test profile
    const profile = await prisma.agentProfile.create({
      data: {
        onchainId: 1,
        name: "Test Agent",
        xHandle: "test_agent",
        characteristics: ["Brave", "Strategic"],
        lore: ["Ancient warrior"],
        knowledge: ["Combat tactics"],
        traits: {
          aggression: {
            value: 80,
            description: "High aggression",
          },
          bravery: {
            value: 90,
            description: "Very brave",
          },
          caution: {
            value: 30,
            description: "Low caution",
          },
        },
      },
    });
    profileId = profile.id;

    // Create test agent
    const agent = await prisma.agent.create({
      data: {
        onchainId: 1,
        authority: "test-authority",
        gameId: game.id,
        health: 100,
        profileId: profile.id,
        mapTiles: {
          create: {
            x: 1,
            y: 1,
            terrainType: TerrainType.Plain,
          },
        },
      },
    });
    agentId = agent.id;

    // Initialize components
    eventEmitter = new EventEmitter();
    actionManager = new ActionManager(program, 1, prisma);
    decisionEngine = new DecisionEngine(
      prisma,
      eventEmitter,
      program,
      actionManager
    );
  });

  afterAll(async () => {
    await prisma.$transaction([
      prisma.mapTile.deleteMany(),
      prisma.agent.deleteMany(),
      prisma.agentProfile.deleteMany(),
      prisma.game.deleteMany(),
    ]);
  });

  describe("processInfluenceScores", () => {
    const mockScores: InfluenceScore[] = [
      {
        interactionId: "1",
        score: 0.8,
        suggestion: {
          type: "MOVE",
          position: { x: 1, y: 1 },
          tweet: "Moving to new position",
        },
      },
    ];

    beforeEach(() => {
      mockPrisma.agent.findUnique.mockResolvedValue({
        id: "agent-1",
        profile: {
          name: "TestAgent",
          xHandle: "test_agent",
          traits: [
            { name: "aggression", value: 80, description: "High aggression" },
          ],
          characteristics: ["Brave", "Strategic"],
          lore: ["Ancient warrior"],
          knowledge: ["Combat tactics"],
        },
        game: { onchainId: 1 },
      } as any);
    });

    it("should process influence scores and return action suggestion", async () => {
      mockGenerateText.mockResolvedValue({
        text: '{"type":"MOVE","position":{"x":1,"y":1},"tweet":"Strategic move"}',
      } as any);

      const result = await decisionEngine.processInfluenceScores(
        { gameId, gameOnchainId: 1, agentId, agentOnchainId: 1 },
        mockScores
      );

      expect(result).toBeDefined();
      expect(result?.type).toBe("MOVE");
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "newAction",
        expect.any(Object)
      );
    });

    it("should return null if agent not found", async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      const result = await decisionEngine.processInfluenceScores(
        { gameId, gameOnchainId: 1, agentId, agentOnchainId: 1 },
        mockScores
      );

      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith("❌ Agent not found");
    });
  });

  describe("executeActionWithFeedback", () => {
    const mockAction: ActionSuggestion = {
      type: "MOVE",
      position: { x: 1, y: 1 },
      tweet: "Test move",
    };

    it("should handle successful action execution", async () => {
      mockActionManager.executeAction.mockResolvedValue({
        success: true,
        feedback: { isValid: true },
      });

      await decisionEngine["executeActionWithFeedback"](
        { gameId, gameOnchainId: 1, agentId, agentOnchainId: 1 },
        mockAction
      );

      expect(mockActionManager.executeAction).toHaveBeenCalledWith(
        { gameId, gameOnchainId: 1, agentId, agentOnchainId: 1 },
        expect.any(Object)
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should handle failed action with retry", async () => {
      mockActionManager.executeAction
        .mockResolvedValueOnce({
          success: false,
          feedback: {
            isValid: false,
            error: {
              type: "MOVE",
              message: "Invalid move",
              context: {
                currentState: {},
                attemptedAction: mockAction,
              },
            },
          },
        })
        .mockResolvedValueOnce({
          success: true,
          feedback: { isValid: true },
        });

      mockGenerateText.mockResolvedValue({
        text: '{"type":"MOVE","position":{"x":2,"y":2},"tweet":"Retrying move"}',
      } as any);

      await decisionEngine["executeActionWithFeedback"](
        { gameId, gameOnchainId: 1, agentId, agentOnchainId: 1 },
        mockAction
      );

      expect(mockActionManager.executeAction).toHaveBeenCalledTimes(2);
      expect(mockGenerateText).toHaveBeenCalled();
    });
  });

  describe("proceedWithoutInteractions", () => {
    it("should generate and execute action when prompt is available", async () => {
      mockGenerateText.mockResolvedValue({
        text: '{"type":"MOVE","position":{"x":1,"y":1},"tweet":"Auto move"}',
      } as any);

      await decisionEngine.proceedWithoutInteractions({
        gameId,
        gameOnchainId: 1,
        agentId,
        agentOnchainId: 1,
      });

      expect(mockGenerateText).toHaveBeenCalled();
      expect(mockActionManager.executeAction).toHaveBeenCalled();
    });

    it("should emit IGNORE action when no prompt available", async () => {
      jest.spyOn(decisionEngine as any, "buildPrompt").mockResolvedValue({
        prompt: "",
        actionContext: {
          gameId,
          gameOnchainId: 1,
          agentId,
          agentOnchainId: 1,
        },
      });

      await decisionEngine.proceedWithoutInteractions({
        gameId,
        gameOnchainId: 1,
        agentId,
        agentOnchainId: 1,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith("newAction", {
        actionContext: { gameId, gameOnchainId: 1, agentId, agentOnchainId: 1 },
        action: { type: "IGNORE" },
      });
    });
  });

  describe("Influence Score Processing", () => {
    it("should process influence scores and generate appropriate action", async () => {
      const actionContext: ActionContext = {
        gameId,
        gameOnchainId: new BN(1),
        agentId,
        agentOnchainId: 1,
      };

      const influenceScores: InfluenceScore[] = [
        {
          interactionId: "1",
          score: 0.8,
          suggestion: {
            type: "BATTLE",
            target: "2",
            content: "Attack enemy",
          },
        },
        {
          interactionId: "2",
          score: 0.7,
          suggestion: {
            type: "BATTLE",
            target: "2",
            content: "Attack enemy",
          },
        },
      ];

      // Mock AI response for battle action
      (generateText as jest.Mock).mockImplementation(async () => ({
        text: "",
        choices: [
          {
            text: "",
            message: {
              content: JSON.stringify({
                type: "BATTLE",
                target: "2",
                content: "Attack enemy",
              } as ActionSuggestion),
            },
          },
        ],
      }));

      // Listen for new action event
      const actionPromise = new Promise<void>((resolve) => {
        eventEmitter.once("newAction", ({ action }) => {
          expect(action).toEqual({
            type: "BATTLE",
            target: "2",
            content: "Attack enemy",
          });
          resolve();
        });
      });

      const result = await decisionEngine.processInfluenceScores(
        actionContext,
        influenceScores
      );

      expect(result).toBeDefined();
      expect(result?.type).toBe("BATTLE");
      expect(result?.target).toBe("2");
      await actionPromise;
    });

    it("should not generate action when influence scores are below threshold", async () => {
      const actionContext: ActionContext = {
        gameId,
        gameOnchainId: new BN(1),
        agentId,
        agentOnchainId: 1,
      };

      const influenceScores: InfluenceScore[] = [
        {
          interactionId: "1",
          score: 0.3,
          suggestion: {
            type: "MOVE",
            position: { x: 2, y: 2 },
          },
        },
        {
          interactionId: "2",
          score: 0.2,
          suggestion: {
            type: "MOVE",
            position: { x: 2, y: 2 },
          },
        },
      ];

      const result = await decisionEngine.processInfluenceScores(
        actionContext,
        influenceScores
      );
      expect(result).toBeNull();
    });
  });

  describe("Character Alignment", () => {
    it("should favor actions aligned with character traits", async () => {
      const actionContext: ActionContext = {
        gameId,
        gameOnchainId: new BN(1),
        agentId,
        agentOnchainId: 1,
      };

      // Battle suggestion should align well with high aggression and bravery
      const influenceScores: InfluenceScore[] = [
        {
          interactionId: "1",
          score: 0.8,
          suggestion: {
            type: "BATTLE",
            target: "2",
            content: "Attack enemy",
          },
        },
      ];

      (generateText as jest.Mock).mockImplementation(async () => ({
        text: "",
        choices: [
          {
            text: "",
            message: {
              content: JSON.stringify({
                type: "BATTLE",
                target: "2",
                content: "Attack enemy",
              } as ActionSuggestion),
            },
          },
        ],
      }));

      const result = await decisionEngine.processInfluenceScores(
        actionContext,
        influenceScores
      );
      expect(result).toBeDefined();
      expect(result?.type).toBe("BATTLE");
    });

    it("should discourage actions misaligned with character traits", async () => {
      const actionContext: ActionContext = {
        gameId,
        gameOnchainId: new BN(1),
        agentId,
        agentOnchainId: 1,
      };

      // Move suggestion with low caution trait should have lower alignment
      const influenceScores: InfluenceScore[] = [
        {
          interactionId: "1",
          score: 0.8,
          suggestion: {
            type: "MOVE",
            position: { x: 2, y: 2 },
          },
        },
      ];

      const result = await decisionEngine.processInfluenceScores(
        actionContext,
        influenceScores
      );
      expect(result).toBeNull();
    });
  });

  describe("Action Execution and Retry", () => {
    it("should retry failed actions with feedback", async () => {
      const actionContext: ActionContext = {
        gameId,
        gameOnchainId: new BN(1),
        agentId,
        agentOnchainId: 1,
      };

      // First attempt - move to occupied tile
      (generateText as jest.Mock).mockImplementation(async () => ({
        text: "",
        choices: [
          {
            text: "",
            message: {
              content: JSON.stringify({
                type: "MOVE",
                position: { x: 2, y: 2 },
              } as ActionSuggestion),
            },
          },
        ],
      }));

      // Create an occupied tile
      await prisma.agent.create({
        data: {
          onchainId: 2,
          authority: "other-authority",
          gameId,
          health: 100,
          profileId,
          mapTiles: {
            create: {
              x: 2,
              y: 2,
              terrainType: TerrainType.Plain,
            },
          },
        },
      });

      const influenceScores: InfluenceScore[] = [
        {
          interactionId: "1",
          score: 0.9,
          suggestion: {
            type: "MOVE",
            position: { x: 2, y: 2 },
          },
        },
      ];

      const result = await decisionEngine.processInfluenceScores(
        actionContext,
        influenceScores
      );
      expect(result).toBeDefined();
      expect(result?.type).toBe("MOVE");
      expect((result as ActionSuggestion)?.position).toEqual({ x: 2, y: 2 });
    });

    it("should stop retrying after max attempts", async () => {
      const actionContext: ActionContext = {
        gameId,
        gameOnchainId: new BN(1),
        agentId,
        agentOnchainId: 1,
      };

      // Mock multiple failed attempts
      (generateText as jest.Mock)
        .mockImplementationOnce(async () => ({
          text: "",
          choices: [
            {
              text: "",
              message: {
                content: JSON.stringify({
                  type: "MOVE",
                  position: { x: 2, y: 2 },
                } as ActionSuggestion),
              },
            },
          ],
        }))
        .mockImplementationOnce(async () => ({
          text: "",
          choices: [
            {
              text: "",
              message: {
                content: JSON.stringify({
                  type: "MOVE",
                  position: { x: 2, y: 2 },
                } as ActionSuggestion),
              },
            },
          ],
        }))
        .mockImplementationOnce(async () => ({
          text: "",
          choices: [
            {
              text: "",
              message: {
                content: JSON.stringify({
                  type: "MOVE",
                  position: { x: 2, y: 2 },
                } as ActionSuggestion),
              },
            },
          ],
        }));

      const influenceScores: InfluenceScore[] = [
        {
          interactionId: "1",
          score: 0.9,
          suggestion: {
            type: "MOVE",
            position: { x: 2, y: 2 },
          },
        },
      ];

      const result = await decisionEngine.processInfluenceScores(
        actionContext,
        influenceScores
      );
      expect(result).toBeNull();
    });
  });
});
