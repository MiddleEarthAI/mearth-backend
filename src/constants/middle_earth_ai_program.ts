/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/middle_earth_ai_program.json`.
 */
export type MiddleEarthAiProgram = {
	address: "FE7WJhRY55XjHcR22ryA3tHLq6fkDNgZBpbh25tto67Q";
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
						"The initiating agent (mutable and signed) that wants to break the alliance.",
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
				},
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
							},
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
					name: "rewardsAuthority";
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
					relations: ["agent"];
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
				{
					name: "tokenProgram";
					address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
				},
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
				},
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
						"The target agent that the initiator wants to form an alliance with.",
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
				},
			];
			args: [];
		},
		{
			name: "ignoreAgent";
			discriminator: [76, 176, 91, 153, 115, 53, 234, 22];
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
					relations: ["agent"];
				},
			];
			args: [
				{
					name: "targetAgentId";
					type: "u8";
				},
			];
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
							},
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
				},
			];
			args: [
				{
					name: "gameId";
					type: "u32";
				},
				{
					name: "bump";
					type: "u8";
				},
			];
		},
		{
			name: "initializeStake";
			discriminator: [33, 175, 216, 4, 116, 130, 164, 177];
			accounts: [
				{
					name: "agent";
					docs: ["The agent this stake will be associated with"];
					writable: true;
				},
				{
					name: "game";
					writable: true;
					relations: ["agent"];
				},
				{
					name: "stakeInfo";
					docs: ["Create the stake_info account (first deposit)"];
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
							},
						];
					};
				},
				{
					name: "stakerSource";
					docs: [
						"It's safe because we manually verify it's owned by the SPL token program.",
					];
					writable: true;
				},
				{
					name: "agentVault";
					docs: [
						"Also safe because we ensure it's owned by the SPL token program.",
					];
					writable: true;
				},
				{
					name: "authority";
					writable: true;
					signer: true;
					relations: ["agent"];
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
				{
					name: "tokenProgram";
					address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
				},
			];
			args: [
				{
					name: "depositAmount";
					type: "u64";
				},
			];
		},
		{
			name: "killAgent";
			docs: [
				"Marks an agent as dead.",
				"**Access Control:** Only the agent's authority (or game authority) may call this function.",
			];
			discriminator: [152, 243, 180, 237, 215, 248, 160, 57];
			accounts: [
				{
					name: "agent";
					writable: true;
				},
				{
					name: "authority";
					docs: [
						"The authority that can perform the kill. In many cases this should match agent.authority.",
					];
					signer: true;
					relations: ["agent"];
				},
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
					relations: ["agent"];
				},
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
				},
			];
		},
		{
			name: "registerAgent";
			docs: [
				"Combined function for agent registration.",
				"This instruction both initializes an Agent account and registers it in the game’s agent list.",
			];
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
					relations: ["game"];
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
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
				},
			];
		},
		{
			name: "resolveBattleAgentVsAlliance";
			docs: [
				"Resolves a battle with alliances by updating cooldowns for all allied agents.",
			];
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
				},
			];
			args: [
				{
					name: "percentLost";
					type: "u8";
				},
				{
					name: "agentIsWinner";
					type: "bool";
				},
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
					relations: ["leaderA", "leaderB"];
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
				},
			];
			args: [
				{
					name: "percentLost";
					type: "u8";
				},
				{
					name: "allianceAWins";
					type: "bool";
				},
			];
		},
		{
			name: "resolveBattleSimple";
			docs: [
				"Resolves a simple battle (without alliances) by updating the winner's and loser's cooldowns.",
			];
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
				},
			];
			args: [
				{
					name: "percentLoss";
					type: "u8";
				},
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
					docs: ["Must be initialized"];
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
							},
						];
					};
				},
				{
					name: "stakerSource";
					docs: [
						"We verify it's owned by the SPL token program to ensure it's a valid token account.",
					];
					writable: true;
				},
				{
					name: "agentVault";
					docs: ["We verify it's owned by the SPL token program."];
					writable: true;
				},
				{
					name: "authority";
					writable: true;
					signer: true;
					relations: ["agent"];
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
				{
					name: "tokenProgram";
					address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
				},
			];
			args: [
				{
					name: "amount";
					type: "u64";
				},
			];
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
							},
						];
					};
				},
				{
					name: "agentVault";
					writable: true;
				},
				{
					name: "agentAuthority";
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									97,
									103,
									101,
									110,
									116,
									95,
									97,
									117,
									116,
									104,
									111,
									114,
									105,
									116,
									121,
								];
							},
							{
								kind: "account";
								path: "agent";
							},
						];
					};
				},
				{
					name: "stakerDestination";
					writable: true;
				},
				{
					name: "authority";
					writable: true;
					signer: true;
					relations: ["agent"];
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
				{
					name: "tokenProgram";
					address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
				},
			];
			args: [
				{
					name: "amount";
					type: "u64";
				},
			];
		},
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
		},
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
						name: "ignoreCooldowns";
						type: {
							vec: {
								defined: {
									name: "ignoreCooldown";
								};
							};
						};
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
						name: "vaultBump";
						type: "u8";
					},
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
					},
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
					},
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
					},
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
					},
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
					},
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
					},
				];
			};
		},
		{
			name: "ignoreCooldown";
			type: {
				kind: "struct";
				fields: [
					{
						name: "agentId";
						type: "u8";
					},
					{
						name: "timestamp";
						type: "i64";
					},
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
							"The last time (Unix timestamp) this staker claimed rewards.",
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
							"Indicates whether the stake_info account has been initialized.",
						];
						type: "bool";
					},
					{
						name: "padding";
						docs: ["Padding to align to 8 bytes"];
						type: {
							array: ["u8", 7];
						};
					},
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
					},
				];
			};
		},
		{
			name: "terrainType";
			docs: [
				"Define terrain types that affect movement.",
				"Note: Make sure to declare the enum as public.",
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
					},
				];
			};
		},
	];
};
