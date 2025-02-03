// import { ethers } from 'ethers';
// import { PrismaClient } from '@prisma/client';
// import { Redis } from 'ioredis';
// import { Logger } from 'winston';
// import { EventEmitter } from 'events';

// // Additional Prisma schema for new components
// /*
// model Battle {
//   id            String   @id
//   initiatorId   String
//   defenderId    String
//   status        String   // PENDING, ACTIVE, COMPLETED
//   outcome       String?  // WIN, LOSS
//   tokensStaked  Float
//   tokensLost    Float?
//   timestamp     DateTime
//   initiator     Agent    @relation("BattleInitiator", fields: [initiatorId], references: [id])
//   defender      Agent    @relation("BattleDefender", fields: [defenderId], references: [id])
// }

// model Alliance {
//   id            String   @id
//   agent1Id      String
//   agent2Id      String
//   startTime     DateTime
//   endTime       DateTime?
//   status        String   // ACTIVE, DISSOLVED
//   agent1        Agent    @relation("AllianceAgent1", fields: [agent1Id], references: [id])
//   agent2        Agent    @relation("AllianceAgent2", fields: [agent2Id], references: [id])
// }

// model TokenStake {
//   id            String   @id
//   agentId       String
//   walletAddress String
//   amount        Float
//   timestamp     DateTime
//   status        String   // ACTIVE, UNSTAKING, WITHDRAWN
//   agent         Agent    @relation(fields: [agentId], references: [id])
// }

// model MapTile {
//   id            String   @id
//   x             Int
//   y             Int
//   type          String   // NORMAL, MOUNTAIN, RIVER
//   occupiedBy    String?
//   agent         Agent?   @relation(fields: [occupiedBy], references: [id])
// }
// */

// // Token Contract Interface
// interface IMiddleEarthToken {
//   balanceOf(address: string): Promise<bigint>;
//   transfer(to: string, amount: bigint): Promise<boolean>;
//   approve(spender: string, amount: bigint): Promise<boolean>;
//   transferFrom(from: string, to: string, amount: bigint): Promise<boolean>;
// }

// // Map System
// class MapSystem {
//   private readonly MAP_SIZE = 689; // Circular map with 689 fields
//   private readonly MOVE_INTERVAL = 3600000; // 1 hour in milliseconds

//   constructor(
//     private prisma: PrismaClient,
//     private eventEmitter: EventEmitter
//   ) {}

//   async initializeMap(): Promise<void> {
//     // Create circular map layout
//     for (let y = 0; y < Math.sqrt(this.MAP_SIZE); y++) {
//       for (let x = 0; x < Math.sqrt(this.MAP_SIZE); x++) {
//         if (this.isWithinCircle(x, y)) {
//           await this.prisma.mapTile.create({
//             data: {
//               x,
//               y,
//               type: this.determineTerrainType(x, y)
//             }
//           });
//         }
//       }
//     }
//   }

//   private isWithinCircle(x: number, y: number): boolean {
//     const centerX = Math.sqrt(this.MAP_SIZE) / 2;
//     const centerY = Math.sqrt(this.MAP_SIZE) / 2;
//     const radius = Math.sqrt(this.MAP_SIZE) / 2;

//     return Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2) <= Math.pow(radius, 2);
//   }

//   private determineTerrainType(x: number, y: number): string {
//     // Implement terrain generation logic
//     const random = Math.random();
//     if (random < 0.1) return 'MOUNTAIN';
//     if (random < 0.25) return 'RIVER';
//     return 'NORMAL';
//   }

//   async moveAgent(agentId: string, newX: number, newY: number): Promise<boolean> {
//     const agent = await this.prisma.agent.findUnique({
//       where: { id: agentId },
//       include: { currentTile: true }
//     });

//     if (!agent) return false;

//     const targetTile = await this.prisma.mapTile.findFirst({
//       where: { x: newX, y: newY }
//     });

//     if (!targetTile) return false;

//     // Check if move is valid
//     if (!this.isValidMove(agent.currentTile!, targetTile)) {
//       return false;
//     }

//     // Apply terrain effects
//     const delay = this.calculateMoveDelay(targetTile.type);

//     // Update position after delay
//     setTimeout(async () => {
//       await this.prisma.mapTile.update({
//         where: { id: agent.currentTile!.id },
//         data: { occupiedBy: null }
//       });

//       await this.prisma.mapTile.update({
//         where: { id: targetTile.id },
//         data: { occupiedBy: agentId }
//       });

//       this.eventEmitter.emit('agentMoved', { agentId, newX, newY });
//     }, delay);

//     return true;
//   }

//   private isValidMove(currentTile: any, targetTile: any): boolean {
//     const dx = Math.abs(currentTile.x - targetTile.x);
//     const dy = Math.abs(currentTile.y - targetTile.y);
//     return dx <= 1 && dy <= 1; // Allow diagonal movement
//   }

//   private calculateMoveDelay(terrainType: string): number {
//     switch (terrainType) {
//       case 'MOUNTAIN': return 2 * this.MOVE_INTERVAL;
//       case 'RIVER': return this.MOVE_INTERVAL;
//       default: return 0;
//     }
//   }

//   async getInteractionRange(agentId: string): Promise<any[]> {
//     const agent = await this.prisma.agent.findUnique({
//       where: { id: agentId },
//       include: { currentTile: true }
//     });

//     if (!agent) return [];

//     return this.prisma.mapTile.findMany({
//       where: {
//         AND: [
//           {
//             x: {
//               gte: agent.currentTile!.x - 1,
//               lte: agent.currentTile!.x + 1
//             }
//           },
//           {
//             y: {
//               gte: agent.currentTile!.y - 1,
//               lte: agent.currentTile!.y + 1
//             }
//           },
//           {
//             occupiedBy: {
//               not: null,
//               not: agentId
//             }
//           }
//         ]
//       },
//       include: { agent: true }
//     });
//   }
// }

// // Token System
// class TokenSystem {
//   private readonly CONTRACT_ADDRESS = "86Hne9YD8ToaNddSe45koHVTbgQaUbn57BGH6k9Wpump";
//   private readonly UNSTAKE_DELAY = 7200000; // 2 hours in milliseconds

//   constructor(
//     private provider: ethers.Provider,
//     private contract: IMiddleEarthToken,
//     private prisma: PrismaClient,
//     private eventEmitter: EventEmitter
//   ) {}

//   async stakeTokens(
//     agentId: string,
//     walletAddress: string,
//     amount: number
//   ): Promise<boolean> {
//     try {
//       // Verify allowance
//       const allowance = await this.contract.balanceOf(walletAddress);
//       if (allowance < BigInt(amount)) return false;

//       // Transfer tokens to contract
//       await this.contract.transferFrom(
//         walletAddress,
//         this.CONTRACT_ADDRESS,
//         BigInt(amount)
//       );

//       // Record stake
//       await this.prisma.tokenStake.create({
//         data: {
//           agentId,
//           walletAddress,
//           amount,
//           status: 'ACTIVE',
//           timestamp: new Date()
//         }
//       });

//       this.eventEmitter.emit('tokensStaked', { agentId, walletAddress, amount });
//       return true;
//     } catch (error) {
//       Logger.error('Stake failed', { error });
//       return false;
//     }
//   }

//   async requestUnstake(stakeId: string): Promise<boolean> {
//     const stake = await this.prisma.tokenStake.findUnique({
//       where: { id: stakeId }
//     });

//     if (!stake || stake.status !== 'ACTIVE') return false;

//     await this.prisma.tokenStake.update({
//       where: { id: stakeId },
//       data: { status: 'UNSTAKING' }
//     });

//     // Process unstake after delay
//     setTimeout(async () => {
//       await this.processUnstake(stakeId);
//     }, this.UNSTAKE_DELAY);

//     return true;
//   }

//   private async processUnstake(stakeId: string): Promise<void> {
//     const stake = await this.prisma.tokenStake.findUnique({
//       where: { id: stakeId }
//     });

//     if (!stake || stake.status !== 'UNSTAKING') return;

//     try {
//       await this.contract.transfer(stake.walletAddress, BigInt(stake.amount));

//       await this.prisma.tokenStake.update({
//         where: { id: stakeId },
//         data: { status: 'WITHDRAWN' }
//       });

//       this.eventEmitter.emit('tokensUnstaked', stake);
//     } catch (error) {
//       Logger.error('Unstake failed', { error, stakeId });
//     }
//   }

//   async getAgentStakeTotal(agentId: string): Promise<number> {
//     const stakes = await this.prisma.tokenStake.findMany({
//       where: {
//         agentId,
//         status: 'ACTIVE'
//       }
//     });

//     return stakes.reduce((total, stake) => total + stake.amount, 0);
//   }
// }

// // Battle System
// class BattleSystem {
//   private readonly DEATH_PROBABILITY = 0.05; // 5% chance of death per loss
//   private readonly MIN_TOKEN_LOSS = 0.21; // 21%
//   private readonly MAX_TOKEN_LOSS = 0.30; // 30%

//   constructor(
//     private prisma: PrismaClient,
//     private tokenSystem: TokenSystem,
//     private eventEmitter: EventEmitter
//   ) {}

//   async initiateBattle(
//     initiatorId: string,
//     defenderId: string
//   ): Promise<boolean> {
//     // Verify agents are within range
//     const inRange = await this.verifyRange(initiatorId, defenderId);
//     if (!inRange) return false;

//     // Check for existing battles
//     const existingBattle = await this.prisma.battle.findFirst({
//       where: {
//         OR: [
//           { initiatorId, defenderId },
//           { initiatorId: defenderId, defenderId: initiatorId }
//         ],
//         status: 'ACTIVE'
//       }
//     });

//     if (existingBattle) return false;

//     // Create battle
//     const battle = await this.prisma.battle.create({
//       data: {
//         initiatorId,
//         defenderId,
//         status: 'PENDING',
//         timestamp: new Date()
//       }
//     });

//     this.eventEmitter.emit('battleInitiated', battle);
//     return true;
//   }

//   private async verifyRange(agent1Id: string, agent2Id: string): Promise<boolean> {
//     const [agent1, agent2] = await Promise.all([
//       this.prisma.agent.findUnique({
//         where: { id: agent1Id },
//         include: { currentTile: true }
//       }),
//       this.prisma.agent.findUnique({
//         where: { id: agent2Id },
//         include: { currentTile: true }
//       })
//     ]);

//     if (!agent1 || !agent2) return false;

//     const dx = Math.abs(agent1.currentTile!.x - agent2.currentTile!.x);
//     const dy = Math.abs(agent1.currentTile!.y - agent2.currentTile!.y);

//     return dx <= 1 && dy <= 1;
//   }

//   async resolveBattle(battleId: string): Promise<void> {
//     const battle = await this.prisma.battle.findUnique({
//       where: { id: battleId },
//       include: {
//         initiator: true,
//         defender: true
//       }
//     });

//     if (!battle || battle.status !== 'PENDING') return;

//     // Calculate token stakes
//     const [initiatorStake, defenderStake] = await Promise.all([
//       this.tokenSystem.getAgentStakeTotal(battle.initiatorId),
//       this.tokenSystem.getAgentStakeTotal(battle.defenderId)
//     ]);

//     const totalStake = initiatorStake + defenderStake;
//     const initiatorProbability = initiatorStake / totalStake;

//     // Determine winner
//     const random = Math.random();
//     const initiatorWins = random < initiatorProbability;
//     const winner = initiatorWins ? battle.initiator : battle.defender;
//     const loser = initiatorWins ? battle.defender : battle.initiator;

//     // Calculate token loss
//     const tokenLossPercentage =
//       this.MIN_TOKEN_LOSS +
//       (Math.random() * (this.MAX_TOKEN_LOSS - this.MIN_TOKEN_LOSS));

//     const tokenLoss = Math.floor(
//       (initiatorWins ? defenderStake : initiatorStake) * tokenLossPercentage
//     );

//     // Check for death
//     const deathRoll = Math.random();
//     const died = deathRoll < this.DEATH_PROBABILITY;

//     // Update battle record
//     await this.prisma.battle.update({
//       where: { id: battleId },
//       data: {
//         status: 'COMPLETED',
//         outcome: initiatorWins ? 'INITIATOR_WIN' : 'DEFENDER_WIN',
//         tokensLost: tokenLoss
//       }
//     });

//     // Handle token transfers
//     if (died) {
//       // Transfer all tokens to winner
//       const loserStake = initiatorWins ? defenderStake : initiatorStake;
//       await this.transferTokens(loser.id, winner.id, loserStake);
//       await this.removeAgent(loser.id);
//     } else {
//       // Transfer lost tokens only
//       await this.transferTokens(loser.id, winner.id, tokenLoss);
//     }

//     this.eventEmitter.emit('battleResolved', {
//       battleId,
//       winnerId: winner.id,
//       loserId: loser.id,
//       tokenLoss,
//       died
//     });
//   }

//   private async transferTokens(
//     fromAgentId: string,
//     toAgentId: string,
//     amount: number
//   ): Promise<void> {
//     // Implement token transfer logic between staking pools
//   }

//   private async removeAgent(agentId: string): Promise<void> {
//     await this.prisma.agent.update({
//       where: { id: agentId },
//       data: { isActive: false }
//     });
//   }
// }

// // Alliance System
// class AllianceSystem {
//   private readonly ALLIANCE_COOLDOWN = 86400000; // 24 hours in milliseconds
//   private readonly INTERACTION_COOLDOWN = 14400000; // 4 hours in milliseconds

//   constructor(
//     private prisma: PrismaClient,
//     private eventEmitter: EventEmitter
//   ) {}

//   async createAlliance(agent1Id: string, agent2Id: string): Promise<boolean> {
//     // Check for existing/recent alliances
//     const re
