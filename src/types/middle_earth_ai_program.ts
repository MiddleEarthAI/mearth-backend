/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/middle_earth_ai_program.json`.
 */
export type MiddleEarthAiProgram = {
  address: "3LkBxfnNptSAEnRJYx3FMgNZJALX7bo4vtya5ofax5Lv";
  metadata: {
    name: "middleEarthAiProgram";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "breakAlliance";
      discriminator: [139, 100, 147, 25, 204, 14, 156, 151];
      accounts: [
        {
          name: "initiator";
          docs: [
            "The initiating agent (mutable and signed) that wants to break the alliance."
          ];
          writable: true;
        },
        {
          name: "targetAgent";
          docs: ["The allied (or target) agent for the alliance."];
          writable: true;
        },
        {
          name: "game";
          docs: ["The global game state holding the alliance list."];
          writable: true;
          relations: ["initiator", "targetAgent"];
        },
        {
          name: "authority";
          docs: ["The signer for the initiating agent."];
          writable: true;
          signer: true;
          relations: ["initiator"];
        }
      ];
      args: [];
    },
    {
      name: "claimStakingRewards";
      discriminator: [229, 141, 170, 69, 111, 94, 6, 72];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "game";
          writable: true;
          relations: ["agent"];
        },
        {
          name: "stakeInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101];
              },
              {
                kind: "account";
                path: "agent";
              },
              {
                kind: "account";
                path: "authority";
              }
            ];
          };
        },
        {
          name: "mint";
        },
        {
          name: "rewardsVault";
          writable: true;
        },
        {
          name: "stakerDestination";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "rewardsAuthority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [];
    },
    {
      name: "endGame";
      discriminator: [224, 135, 245, 99, 67, 175, 121, 252];
      accounts: [
        {
          name: "game";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
          relations: ["game"];
        }
      ];
      args: [];
    },
    {
      name: "formAlliance";
      discriminator: [113, 30, 47, 217, 83, 151, 0, 174];
      accounts: [
        {
          name: "initiator";
          docs: ["The initiating agent (must be mutable and signed)."];
          writable: true;
        },
        {
          name: "targetAgent";
          docs: [
            "The target agent that the initiator wants to form an alliance with."
          ];
          writable: true;
        },
        {
          name: "game";
          docs: ["The global game state holding the alliance list."];
          writable: true;
          relations: ["initiator", "targetAgent"];
        },
        {
          name: "authority";
          docs: ["The signer for the initiating agent."];
          writable: true;
          signer: true;
          relations: ["initiator"];
        }
      ];
      args: [];
    },
    {
      name: "initializeGame";
      discriminator: [44, 62, 102, 247, 126, 208, 130, 215];
      accounts: [
        {
          name: "game";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 97, 109, 101];
              },
              {
                kind: "arg";
                path: "gameId";
              }
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "gameId";
          type: "u32";
        },
        {
          name: "bump";
          type: "u8";
        }
      ];
    },
    {
      name: "initializeStake";
      discriminator: [33, 175, 216, 4, 116, 130, 164, 177];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "game";
          writable: true;
          relations: ["agent"];
        },
        {
          name: "stakeInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101];
              },
              {
                kind: "account";
                path: "agent";
              },
              {
                kind: "account";
                path: "authority";
              }
            ];
          };
        },
        {
          name: "stakerSource";
          writable: true;
        },
        {
          name: "agentVault";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [
        {
          name: "depositAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "initiateCooldown";
      docs: ["Allows a staker to initiate a 2-hour cooldown before unstaking."];
      discriminator: [156, 179, 66, 226, 152, 118, 213, 187];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "game";
          writable: true;
          relations: ["agent"];
        },
        {
          name: "stakeInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101];
              },
              {
                kind: "account";
                path: "agent";
              },
              {
                kind: "account";
                path: "authority";
              }
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "killAgent";
      discriminator: [152, 243, 180, 237, 215, 248, 160, 57];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
          relations: ["agent"];
        }
      ];
      args: [];
    },
    {
      name: "moveAgent";
      discriminator: [48, 110, 55, 44, 181, 65, 102, 207];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "game";
          relations: ["agent"];
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [
        {
          name: "newX";
          type: "i32";
        },
        {
          name: "newY";
          type: "i32";
        },
        {
          name: "terrain";
          type: {
            defined: {
              name: "terrainType";
            };
          };
        }
      ];
    },
    {
      name: "registerAgent";
      docs: ["Registers a new Agent in the game (init + list registration)."];
      discriminator: [135, 157, 66, 195, 2, 113, 175, 30];
      accounts: [
        {
          name: "game";
          writable: true;
        },
        {
          name: "agent";
          docs: ["The Agent account is initialized using PDA seeds."];
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "agentId";
          type: "u8";
        },
        {
          name: "x";
          type: "i32";
        },
        {
          name: "y";
          type: "i32";
        },
        {
          name: "name";
          type: "string";
        }
      ];
    },
    {
      name: "resetBattleTimes";
      discriminator: [146, 108, 240, 41, 237, 80, 28, 102];
      accounts: [
        {
          name: "agent1";
          writable: true;
        },
        {
          name: "agent2";
          writable: true;
        },
        {
          name: "agent3";
          writable: true;
        },
        {
          name: "agent4";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "resolveBattleAgentVsAlliance";
      discriminator: [59, 240, 150, 171, 245, 203, 23, 134];
      accounts: [
        {
          name: "singleAgent";
          writable: true;
        },
        {
          name: "allianceLeader";
          writable: true;
        },
        {
          name: "alliancePartner";
          writable: true;
        },
        {
          name: "game";
          relations: ["singleAgent", "allianceLeader", "alliancePartner"];
        },
        {
          name: "singleAgentToken";
          writable: true;
        },
        {
          name: "allianceLeaderToken";
          writable: true;
        },
        {
          name: "alliancePartnerToken";
          writable: true;
        },
        {
          name: "singleAgentAuthority";
          signer: true;
        },
        {
          name: "allianceLeaderAuthority";
          signer: true;
        },
        {
          name: "alliancePartnerAuthority";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [
        {
          name: "percentLost";
          type: "u8";
        },
        {
          name: "agentIsWinner";
          type: "bool";
        }
      ];
    },
    {
      name: "resolveBattleAllianceVsAlliance";
      discriminator: [20, 169, 74, 19, 75, 163, 159, 134];
      accounts: [
        {
          name: "leaderA";
          writable: true;
        },
        {
          name: "partnerA";
          writable: true;
        },
        {
          name: "leaderB";
          writable: true;
        },
        {
          name: "partnerB";
          writable: true;
        },
        {
          name: "game";
          relations: ["leaderA", "partnerA", "leaderB", "partnerB"];
        },
        {
          name: "leaderAToken";
          writable: true;
        },
        {
          name: "partnerAToken";
          writable: true;
        },
        {
          name: "leaderBToken";
          writable: true;
        },
        {
          name: "partnerBToken";
          writable: true;
        },
        {
          name: "leaderAAuthority";
          signer: true;
        },
        {
          name: "partnerAAuthority";
          signer: true;
        },
        {
          name: "leaderBAuthority";
          signer: true;
        },
        {
          name: "partnerBAuthority";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [
        {
          name: "percentLost";
          type: "u8";
        },
        {
          name: "allianceAWins";
          type: "bool";
        }
      ];
    },
    {
      name: "resolveBattleSimple";
      discriminator: [194, 166, 52, 185, 99, 39, 139, 37];
      accounts: [
        {
          name: "winner";
          writable: true;
        },
        {
          name: "loser";
          writable: true;
        },
        {
          name: "game";
          relations: ["winner", "loser"];
        },
        {
          name: "winnerToken";
          writable: true;
        },
        {
          name: "loserToken";
          writable: true;
        },
        {
          name: "loserAuthority";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [
        {
          name: "percentLoss";
          type: "u8";
        }
      ];
    },
    {
      name: "setAgentCooldown";
      discriminator: [135, 110, 177, 130, 20, 228, 172, 214];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "game";
          relations: ["agent"];
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [
        {
          name: "newCooldown";
          type: "i64";
        }
      ];
    },
    {
      name: "stakeTokens";
      discriminator: [136, 126, 91, 162, 40, 131, 13, 127];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "game";
          writable: true;
          relations: ["agent"];
        },
        {
          name: "stakeInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101];
              },
              {
                kind: "account";
                path: "agent";
              },
              {
                kind: "account";
                path: "authority";
              }
            ];
          };
        },
        {
          name: "stakerSource";
          writable: true;
        },
        {
          name: "agentVault";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "startBattleAgentVsAlliance";
      docs: ["Starts a battle between an agent and an alliance."];
      discriminator: [29, 18, 137, 62, 26, 102, 56, 46];
      accounts: [
        {
          name: "attacker";
          writable: true;
        },
        {
          name: "allianceLeader";
          writable: true;
        },
        {
          name: "alliancePartner";
          writable: true;
        },
        {
          name: "game";
          relations: ["attacker", "allianceLeader", "alliancePartner"];
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "startBattleAlliances";
      docs: ["Starts a battle between two alliances."];
      discriminator: [246, 90, 25, 201, 196, 166, 220, 54];
      accounts: [
        {
          name: "leaderA";
          writable: true;
        },
        {
          name: "partnerA";
          writable: true;
        },
        {
          name: "leaderB";
          writable: true;
        },
        {
          name: "partnerB";
          writable: true;
        },
        {
          name: "game";
          relations: ["leaderA", "partnerA", "leaderB", "partnerB"];
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "startBattleSimple";
      discriminator: [32, 12, 65, 240, 219, 11, 225, 62];
      accounts: [
        {
          name: "winner";
          writable: true;
        },
        {
          name: "loser";
          writable: true;
        },
        {
          name: "game";
          relations: ["winner", "loser"];
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "unstakeTokens";
      discriminator: [58, 119, 215, 143, 203, 223, 32, 86];
      accounts: [
        {
          name: "agent";
          writable: true;
        },
        {
          name: "game";
          writable: true;
          relations: ["agent"];
        },
        {
          name: "stakeInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101];
              },
              {
                kind: "account";
                path: "agent";
              },
              {
                kind: "account";
                path: "authority";
              }
            ];
          };
        },
        {
          name: "agentVault";
          writable: true;
        },
        {
          name: "stakerDestination";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "gameAuthority";
          docs: ["The game authority, who owns the vault"];
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "updateDailyRewards";
      discriminator: [235, 160, 223, 244, 149, 193, 160, 179];
      accounts: [
        {
          name: "game";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
        }
      ];
      args: [
        {
          name: "newDailyReward";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "agent";
      discriminator: [47, 166, 112, 147, 155, 197, 86, 7];
    },
    {
      name: "game";
      discriminator: [27, 90, 166, 125, 74, 100, 121, 18];
    },
    {
      name: "stakeInfo";
      discriminator: [66, 62, 68, 70, 108, 179, 183, 235];
    }
  ];
  events: [
    {
      name: "agentMoved";
      discriminator: [62, 208, 5, 94, 58, 167, 86, 68];
    },
    {
      name: "battleInitiated";
      discriminator: [143, 241, 154, 163, 133, 237, 42, 247];
    },
    {
      name: "battleResolved";
      discriminator: [47, 156, 226, 94, 163, 176, 162, 241];
    },
    {
      name: "cooldownInitiated";
      discriminator: [251, 119, 98, 184, 229, 163, 146, 86];
    },
    {
      name: "dailyRewardUpdated";
      discriminator: [147, 255, 214, 103, 150, 229, 42, 92];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "agentNotAlive";
      msg: "Agent is not alive.";
    },
    {
      code: 6001;
      name: "movementCooldown";
      msg: "Movement is on cooldown.";
    },
    {
      code: 6002;
      name: "outOfBounds";
      msg: "Agent is out of map bounds.";
    },
    {
      code: 6003;
      name: "battleInProgress";
      msg: "Battle is currently in progress.";
    },
    {
      code: 6004;
      name: "battleCooldown";
      msg: "Battle is on cooldown.";
    },
    {
      code: 6005;
      name: "reentrancyGuard";
      msg: "Reentrancy attempt detected.";
    },
    {
      code: 6006;
      name: "allianceCooldown";
      msg: "Alliance is on cooldown.";
    },
    {
      code: 6007;
      name: "notEnoughTokens";
      msg: "Not enough tokens for battle.";
    },
    {
      code: 6008;
      name: "maxStakeExceeded";
      msg: "Stake amount exceeds maximum allowed.";
    },
    {
      code: 6009;
      name: "claimCooldown";
      msg: "Cannot claim rewards yet.";
    },
    {
      code: 6010;
      name: "invalidTerrain";
      msg: "Invalid terrain movement.";
    },
    {
      code: 6011;
      name: "tokenTransferError";
      msg: "Invalid token transfer.";
    },
    {
      code: 6012;
      name: "insufficientFunds";
      msg: "Insufficient Funds Provided.";
    },
    {
      code: 6013;
      name: "unauthorized";
      msg: "Unauthorized action.";
    },
    {
      code: 6014;
      name: "ignoreCooldown";
      msg: "Cooldown is still active.";
    },
    {
      code: 6015;
      name: "invalidAlliancePartner";
      msg: "Invalid alliance partner.";
    },
    {
      code: 6016;
      name: "allianceAlreadyExists";
      msg: "An active alliance already exists.";
    },
    {
      code: 6017;
      name: "noAllianceToBreak";
      msg: "No active alliance to break.";
    },
    {
      code: 6018;
      name: "maxAgentLimitReached";
      msg: "Maximum number of agents reached.";
    },
    {
      code: 6019;
      name: "agentAlreadyExists";
      msg: "Agent already exists.";
    },
    {
      code: 6020;
      name: "nameTooLong";
      msg: "Agent name is too long.";
    },
    {
      code: 6021;
      name: "cooldownNotOver";
      msg: "You must wait until cooldown ends.";
    },
    {
      code: 6022;
      name: "gameNotActive";
      msg: "Game is Inactive";
    },
    {
      code: 6023;
      name: "invalidAmount";
      msg: "Invalid amount specified.";
    },
    {
      code: 6024;
      name: "invalidBump";
      msg: "Invalid bump.";
    },
    {
      code: 6025;
      name: "noRewardsToClaim";
      msg: "No rewards to claim.";
    },
    {
      code: 6026;
      name: "insufficientRewards";
      msg: "Insufficient rewards to complete this action.";
    },
    {
      code: 6027;
      name: "cooldownAlreadyActive";
      msg: "Cooldown is already active.";
    },
    {
      code: 6028;
      name: "battleNotStarted";
      msg: "Battle has not started yet ";
    },
    {
      code: 6029;
      name: "battleAlreadyStarted";
      msg: "Battle has already started ";
    },
    {
      code: 6030;
      name: "battleNotReadyToResolve";
      msg: "Battle not ready to resolve";
    }
  ];
  types: [
    {
      name: "agent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "game";
            type: "pubkey";
          },
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "id";
            type: "u8";
          },
          {
            name: "x";
            type: "i32";
          },
          {
            name: "y";
            type: "i32";
          },
          {
            name: "isAlive";
            type: "bool";
          },
          {
            name: "lastMove";
            type: "i64";
          },
          {
            name: "lastBattle";
            type: "i64";
          },
          {
            name: "currentBattleStart";
            type: {
              option: "i64";
            };
          },
          {
            name: "allianceWith";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "allianceTimestamp";
            type: "i64";
          },
          {
            name: "tokenBalance";
            type: "u64";
          },
          {
            name: "stakedBalance";
            type: "u64";
          },
          {
            name: "lastRewardClaim";
            type: "i64";
          },
          {
            name: "totalShares";
            type: "u128";
          },
          {
            name: "lastAttack";
            type: "i64";
          },
          {
            name: "lastIgnore";
            type: "i64";
          },
          {
            name: "lastAlliance";
            type: "i64";
          },
          {
            name: "nextMoveTime";
            type: "i64";
          },
          {
            name: "lastAllianceAgent";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "lastAllianceBroken";
            type: "i64";
          },
          {
            name: "battleStartTime";
            type: {
              option: "i64";
            };
          },
          {
            name: "vaultBump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "agentInfo";
      docs: ["Holds basic information for an agent."];
      type: {
        kind: "struct";
        fields: [
          {
            name: "key";
            type: "pubkey";
          },
          {
            name: "name";
            type: "string";
          }
        ];
      };
    },
    {
      name: "agentMoved";
      type: {
        kind: "struct";
        fields: [
          {
            name: "agentId";
            type: "u8";
          },
          {
            name: "oldX";
            type: "i32";
          },
          {
            name: "oldY";
            type: "i32";
          },
          {
            name: "newX";
            type: "i32";
          },
          {
            name: "newY";
            type: "i32";
          }
        ];
      };
    },
    {
      name: "alliance";
      type: {
        kind: "struct";
        fields: [
          {
            name: "agent1";
            type: "pubkey";
          },
          {
            name: "agent2";
            type: "pubkey";
          },
          {
            name: "formedAt";
            type: "i64";
          },
          {
            name: "isActive";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "battleInitiated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "agentId";
            type: "u8";
          },
          {
            name: "opponentAgentId";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "battleResolved";
      type: {
        kind: "struct";
        fields: [
          {
            name: "winnerId";
            type: "u8";
          },
          {
            name: "loserId";
            type: "u8";
          },
          {
            name: "transferAmount";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "cooldownInitiated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "stakeInfo";
            type: "pubkey";
          },
          {
            name: "cooldownEndsAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "dailyRewardUpdated";
      docs: ["Optional events"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "newDailyReward";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "game";
      type: {
        kind: "struct";
        fields: [
          {
            name: "gameId";
            type: "u64";
          },
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "tokenMint";
            type: "pubkey";
          },
          {
            name: "rewardsVault";
            type: "pubkey";
          },
          {
            name: "mapDiameter";
            type: "u32";
          },
          {
            name: "isActive";
            type: "bool";
          },
          {
            name: "lastUpdate";
            type: "i64";
          },
          {
            name: "reentrancyGuard";
            type: "bool";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "dailyRewardTokens";
            type: "u64";
          },
          {
            name: "alliances";
            type: {
              vec: {
                defined: {
                  name: "alliance";
                };
              };
            };
          },
          {
            name: "agents";
            type: {
              vec: {
                defined: {
                  name: "agentInfo";
                };
              };
            };
          },
          {
            name: "totalStakeAccounts";
            type: {
              vec: {
                defined: {
                  name: "stakerStake";
                };
              };
            };
          }
        ];
      };
    },
    {
      name: "stakeInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "agent";
            docs: ["The Agent (vault) this stake is associated with."];
            type: "pubkey";
          },
          {
            name: "staker";
            docs: ["The staker’s public key."];
            type: "pubkey";
          },
          {
            name: "amount";
            docs: ["The amount of tokens the user has deposited."];
            type: "u64";
          },
          {
            name: "shares";
            docs: ["The number of shares the user holds."];
            type: "u128";
          },
          {
            name: "lastRewardTimestamp";
            docs: [
              "The last time (Unix timestamp) this staker claimed rewards."
            ];
            type: "i64";
          },
          {
            name: "cooldownEndsAt";
            docs: ["The Unix timestamp when the cooldown ends."];
            type: "i64";
          },
          {
            name: "isInitialized";
            docs: [
              "Indicates whether the stake_info account has been initialized."
            ];
            type: "bool";
          },
          {
            name: "padding";
            docs: ["Padding to align to 8 bytes"];
            type: {
              array: ["u8", 7];
            };
          }
        ];
      };
    },
    {
      name: "stakerStake";
      type: {
        kind: "struct";
        fields: [
          {
            name: "staker";
            type: "pubkey";
          },
          {
            name: "totalStake";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "terrainType";
      docs: [
        "Define terrain types that affect movement.",
        "Note: Make sure to declare the enum as public."
      ];
      type: {
        kind: "enum";
        variants: [
          {
            name: "plain";
          },
          {
            name: "mountain";
          },
          {
            name: "river";
          }
        ];
      };
    }
  ];
};
