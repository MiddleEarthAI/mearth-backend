export const mearthIdl = {
  address: "6DSSNV3bHaCn8RF6VD64Y7mBX1Uh2T9gUcaEW1U9J2Yx",
  metadata: {
    name: "middle_earth_ai_program",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "break_alliance",
      discriminator: [139, 100, 147, 25, 204, 14, 156, 151],
      accounts: [
        {
          name: "initiator",
          docs: [
            "The initiating agent (mutable and signed) that wants to break the alliance.",
          ],
          writable: true,
        },
        {
          name: "target_agent",
          docs: ["The allied (or target) agent for the alliance."],
          writable: true,
        },
        {
          name: "game",
          docs: ["The global game state holding the alliance list."],
          writable: true,
          relations: ["initiator", "target_agent"],
        },
        {
          name: "authority",
          docs: ["The signer for the initiating agent."],
          writable: true,
          signer: true,
          relations: ["initiator"],
        },
      ],
      args: [],
    },
    {
      name: "claim_staking_rewards",
      discriminator: [229, 141, 170, 69, 111, 94, 6, 72],
      accounts: [
        {
          name: "agent",
          writable: true,
        },
        {
          name: "game",
          writable: true,
          relations: ["agent"],
        },
        {
          name: "stake_info",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 116, 97, 107, 101],
              },
              {
                kind: "account",
                path: "agent",
              },
              {
                kind: "account",
                path: "authority",
              },
            ],
          },
        },
        {
          name: "mint",
        },
        {
          name: "rewards_vault",
          writable: true,
        },
        {
          name: "staker_destination",
          writable: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "rewards_authority",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      args: [],
    },
    {
      name: "end_game",
      discriminator: [224, 135, 245, 99, 67, 175, 121, 252],
      accounts: [
        {
          name: "game",
          writable: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
          relations: ["game"],
        },
      ],
      args: [],
    },
    {
      name: "form_alliance",
      discriminator: [113, 30, 47, 217, 83, 151, 0, 174],
      accounts: [
        {
          name: "initiator",
          docs: ["The initiating agent (must be mutable and signed)."],
          writable: true,
        },
        {
          name: "target_agent",
          docs: [
            "The target agent that the initiator wants to form an alliance with.",
          ],
          writable: true,
        },
        {
          name: "game",
          docs: ["The global game state holding the alliance list."],
          writable: true,
          relations: ["initiator", "target_agent"],
        },
        {
          name: "authority",
          docs: ["The signer for the initiating agent."],
          writable: true,
          signer: true,
          relations: ["initiator"],
        },
      ],
      args: [],
    },
    {
      name: "initialize_game",
      discriminator: [44, 62, 102, 247, 126, 208, 130, 215],
      accounts: [
        {
          name: "game",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [103, 97, 109, 101],
              },
              {
                kind: "arg",
                path: "game_id",
              },
            ],
          },
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "game_id",
          type: "u32",
        },
        {
          name: "bump",
          type: "u8",
        },
      ],
    },
    {
      name: "initialize_stake",
      discriminator: [33, 175, 216, 4, 116, 130, 164, 177],
      accounts: [
        {
          name: "agent",
          writable: true,
        },
        {
          name: "game",
          writable: true,
          relations: ["agent"],
        },
        {
          name: "stake_info",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 116, 97, 107, 101],
              },
              {
                kind: "account",
                path: "agent",
              },
              {
                kind: "account",
                path: "authority",
              },
            ],
          },
        },
        {
          name: "staker_source",
          writable: true,
        },
        {
          name: "agent_vault",
          writable: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      args: [
        {
          name: "deposit_amount",
          type: "u64",
        },
      ],
    },
    {
      name: "kill_agent",
      discriminator: [152, 243, 180, 237, 215, 248, 160, 57],
      accounts: [
        {
          name: "agent",
          writable: true,
        },
        {
          name: "game",
        },
        {
          name: "authority",
          docs: ["The caller must be the game authority."],
          writable: true,
          signer: true,
          relations: ["agent"],
        },
      ],
      args: [],
    },
    {
      name: "move_agent",
      discriminator: [48, 110, 55, 44, 181, 65, 102, 207],
      accounts: [
        {
          name: "agent",
          writable: true,
        },
        {
          name: "game",
          relations: ["agent"],
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
      ],
      args: [
        {
          name: "new_x",
          type: "i32",
        },
        {
          name: "new_y",
          type: "i32",
        },
        {
          name: "terrain",
          type: {
            defined: {
              name: "TerrainType",
            },
          },
        },
      ],
    },
    {
      name: "register_agent",
      docs: ["Registers a new Agent in the game (init + list registration)."],
      discriminator: [135, 157, 66, 195, 2, 113, 175, 30],
      accounts: [
        {
          name: "game",
          writable: true,
        },
        {
          name: "agent",
          docs: ["The Agent account is initialized using PDA seeds."],
          writable: true,
        },
        {
          name: "authority",
          docs: ["The caller must be the game authority."],
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "agent_id",
          type: "u8",
        },
        {
          name: "x",
          type: "i32",
        },
        {
          name: "y",
          type: "i32",
        },
        {
          name: "name",
          type: "string",
        },
      ],
    },
    {
      name: "resolve_battle_agent_vs_alliance",
      discriminator: [59, 240, 150, 171, 245, 203, 23, 134],
      accounts: [
        {
          name: "single_agent",
          writable: true,
        },
        {
          name: "alliance_leader",
          writable: true,
        },
        {
          name: "alliance_partner",
          writable: true,
        },
        {
          name: "game",
          relations: ["single_agent", "alliance_leader", "alliance_partner"],
        },
        {
          name: "single_agent_token",
          writable: true,
        },
        {
          name: "alliance_leader_token",
          writable: true,
        },
        {
          name: "alliance_partner_token",
          writable: true,
        },
        {
          name: "single_agent_authority",
          signer: true,
        },
        {
          name: "alliance_leader_authority",
          signer: true,
        },
        {
          name: "alliance_partner_authority",
          signer: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
      ],
      args: [
        {
          name: "percent_lost",
          type: "u8",
        },
        {
          name: "agent_is_winner",
          type: "bool",
        },
      ],
    },
    {
      name: "resolve_battle_alliance_vs_alliance",
      discriminator: [20, 169, 74, 19, 75, 163, 159, 134],
      accounts: [
        {
          name: "leader_a",
          writable: true,
        },
        {
          name: "partner_a",
          writable: true,
        },
        {
          name: "leader_b",
          writable: true,
        },
        {
          name: "partner_b",
          writable: true,
        },
        {
          name: "game",
          relations: ["leader_a", "partner_a", "leader_b", "partner_b"],
        },
        {
          name: "leader_a_token",
          writable: true,
        },
        {
          name: "partner_a_token",
          writable: true,
        },
        {
          name: "leader_b_token",
          writable: true,
        },
        {
          name: "partner_b_token",
          writable: true,
        },
        {
          name: "leader_a_authority",
          signer: true,
        },
        {
          name: "partner_a_authority",
          signer: true,
        },
        {
          name: "leader_b_authority",
          signer: true,
        },
        {
          name: "partner_b_authority",
          signer: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
      ],
      args: [
        {
          name: "percent_lost",
          type: "u8",
        },
        {
          name: "alliance_a_wins",
          type: "bool",
        },
      ],
    },
    {
      name: "resolve_battle_simple",
      discriminator: [194, 166, 52, 185, 99, 39, 139, 37],
      accounts: [
        {
          name: "winner",
          writable: true,
        },
        {
          name: "loser",
          writable: true,
        },
        {
          name: "game",
          relations: ["winner", "loser"],
        },
        {
          name: "winner_token",
          writable: true,
        },
        {
          name: "loser_token",
          writable: true,
        },
        {
          name: "loser_authority",
          signer: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
      ],
      args: [
        {
          name: "percent_loss",
          type: "u8",
        },
      ],
    },
    {
      name: "set_agent_cooldown",
      docs: ["Allows a staker to initiate a 2-hour cooldown before unstaking."],
      discriminator: [135, 110, 177, 130, 20, 228, 172, 214],
      accounts: [
        {
          name: "agent",
          writable: true,
        },
        {
          name: "game",
          relations: ["agent"],
        },
        {
          name: "authority",
          docs: ["The caller must be the game authority."],
          writable: true,
          signer: true,
        },
      ],
      args: [
        {
          name: "new_cooldown",
          type: "i64",
        },
      ],
    },
    {
      name: "stake_tokens",
      discriminator: [136, 126, 91, 162, 40, 131, 13, 127],
      accounts: [
        {
          name: "agent",
          writable: true,
        },
        {
          name: "game",
          writable: true,
          relations: ["agent"],
        },
        {
          name: "stake_info",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 116, 97, 107, 101],
              },
              {
                kind: "account",
                path: "agent",
              },
              {
                kind: "account",
                path: "authority",
              },
            ],
          },
        },
        {
          name: "staker_source",
          writable: true,
        },
        {
          name: "agent_vault",
          writable: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "unstake_tokens",
      discriminator: [58, 119, 215, 143, 203, 223, 32, 86],
      accounts: [
        {
          name: "agent",
          writable: true,
        },
        {
          name: "game",
          writable: true,
          relations: ["agent"],
        },
        {
          name: "stake_info",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 116, 97, 107, 101],
              },
              {
                kind: "account",
                path: "agent",
              },
              {
                kind: "account",
                path: "authority",
              },
            ],
          },
        },
        {
          name: "agent_vault",
          writable: true,
        },
        {
          name: "staker_destination",
          writable: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "game_authority",
          docs: ["The game authority, who owns the vault"],
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "update_daily_rewards",
      discriminator: [235, 160, 223, 244, 149, 193, 160, 179],
      accounts: [
        {
          name: "game",
          writable: true,
        },
        {
          name: "authority",
          signer: true,
        },
      ],
      args: [
        {
          name: "new_daily_reward",
          type: "u64",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "Agent",
      discriminator: [47, 166, 112, 147, 155, 197, 86, 7],
    },
    {
      name: "Game",
      discriminator: [27, 90, 166, 125, 74, 100, 121, 18],
    },
    {
      name: "StakeInfo",
      discriminator: [66, 62, 68, 70, 108, 179, 183, 235],
    },
  ],
  events: [
    {
      name: "AgentMoved",
      discriminator: [62, 208, 5, 94, 58, 167, 86, 68],
    },
    {
      name: "BattleInitiated",
      discriminator: [143, 241, 154, 163, 133, 237, 42, 247],
    },
    {
      name: "BattleResolved",
      discriminator: [47, 156, 226, 94, 163, 176, 162, 241],
    },
    {
      name: "CooldownInitiated",
      discriminator: [251, 119, 98, 184, 229, 163, 146, 86],
    },
    {
      name: "DailyRewardUpdated",
      discriminator: [147, 255, 214, 103, 150, 229, 42, 92],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "NotEnoughShares",
      msg: "Not Enough Shares",
    },
    {
      code: 6001,
      name: "MultiplicationError",
      msg: "Multiplication Error",
    },
    {
      code: 6002,
      name: "DivisionError",
      msg: "Division Error",
    },
    {
      code: 6003,
      name: "SubtractionError",
      msg: "Subtraction Error",
    },
    {
      code: 6004,
      name: "AdditionError",
      msg: "Addition Error",
    },
    {
      code: 6005,
      name: "AgentNotAlive",
      msg: "Agent is not alive.",
    },
    {
      code: 6006,
      name: "MovementCooldown",
      msg: "Movement is on cooldown.",
    },
    {
      code: 6007,
      name: "OutOfBounds",
      msg: "Agent is out of map bounds.",
    },
    {
      code: 6008,
      name: "BattleInProgress",
      msg: "Battle is currently in progress.",
    },
    {
      code: 6009,
      name: "BattleCooldown",
      msg: "Battle is on cooldown.",
    },
    {
      code: 6010,
      name: "ReentrancyGuard",
      msg: "Reentrancy attempt detected.",
    },
    {
      code: 6011,
      name: "AllianceCooldown",
      msg: "Alliance is on cooldown.",
    },
    {
      code: 6012,
      name: "NotEnoughTokens",
      msg: "Not enough tokens for battle.",
    },
    {
      code: 6013,
      name: "MaxStakeExceeded",
      msg: "Stake amount exceeds maximum allowed.",
    },
    {
      code: 6014,
      name: "ClaimCooldown",
      msg: "Cannot claim rewards yet.",
    },
    {
      code: 6015,
      name: "InvalidTerrain",
      msg: "Invalid terrain movement.",
    },
    {
      code: 6016,
      name: "TokenTransferError",
      msg: "Invalid token transfer.",
    },
    {
      code: 6017,
      name: "InsufficientFunds",
      msg: "Insufficient Funds Provided.",
    },
    {
      code: 6018,
      name: "Unauthorized",
      msg: "Unauthorized action.",
    },
    {
      code: 6019,
      name: "IgnoreCooldown",
      msg: "Cooldown is still active.",
    },
    {
      code: 6020,
      name: "InvalidAlliancePartner",
      msg: "Invalid alliance partner.",
    },
    {
      code: 6021,
      name: "AllianceAlreadyExists",
      msg: "An active alliance already exists.",
    },
    {
      code: 6022,
      name: "NoAllianceToBreak",
      msg: "No active alliance to break.",
    },
    {
      code: 6023,
      name: "MaxAgentLimitReached",
      msg: "Maximum number of agents reached.",
    },
    {
      code: 6024,
      name: "AgentAlreadyExists",
      msg: "Agent already exists.",
    },
    {
      code: 6025,
      name: "NameTooLong",
      msg: "Agent name is too long.",
    },
    {
      code: 6026,
      name: "CooldownNotOver",
      msg: "You must wait until cooldown ends.",
    },
    {
      code: 6027,
      name: "GameNotActive",
      msg: "Game is Inactive",
    },
    {
      code: 6028,
      name: "InvalidAmount",
      msg: "Invalid amount specified.",
    },
    {
      code: 6029,
      name: "InvalidBump",
      msg: "Invalid bump.",
    },
    {
      code: 6030,
      name: "NoRewardsToClaim",
      msg: "No rewards to claim.",
    },
    {
      code: 6031,
      name: "InsufficientRewards",
      msg: "Insufficient rewards to complete this action.",
    },
    {
      code: 6032,
      name: "CooldownAlreadyActive",
      msg: "Cooldown is already active.",
    },
    {
      code: 6033,
      name: "BattleNotStarted",
      msg: "Battle has not started yet ",
    },
    {
      code: 6034,
      name: "BattleAlreadyStarted",
      msg: "Battle has already started ",
    },
    {
      code: 6035,
      name: "BattleNotReadyToResolve",
      msg: "Battle not ready to resolve",
    },
  ],
  types: [
    {
      name: "Agent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "game",
            type: "pubkey",
          },
          {
            name: "authority",
            type: "pubkey",
          },
          {
            name: "id",
            type: "u8",
          },
          {
            name: "x",
            type: "i32",
          },
          {
            name: "y",
            type: "i32",
          },
          {
            name: "is_alive",
            type: "bool",
          },
          {
            name: "last_move",
            type: "i64",
          },
          {
            name: "last_battle",
            type: "i64",
          },
          {
            name: "staked_balance",
            type: "u128",
          },
          {
            name: "alliance_with",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "alliance_timestamp",
            type: "i64",
          },
          {
            name: "token_balance",
            type: "u64",
          },
          {
            name: "last_reward_claim",
            type: "i64",
          },
          {
            name: "total_shares",
            type: "u128",
          },
          {
            name: "last_attack",
            type: "i64",
          },
          {
            name: "last_ignore",
            type: "i64",
          },
          {
            name: "last_alliance",
            type: "i64",
          },
          {
            name: "next_move_time",
            type: "i64",
          },
          {
            name: "last_alliance_agent",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "last_alliance_broken",
            type: "i64",
          },
          {
            name: "battle_start_time",
            type: {
              option: "i64",
            },
          },
          {
            name: "vault_bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "AgentInfo",
      docs: ["Holds basic information for an agent."],
      type: {
        kind: "struct",
        fields: [
          {
            name: "key",
            type: "pubkey",
          },
          {
            name: "name",
            type: "string",
          },
        ],
      },
    },
    {
      name: "AgentMoved",
      type: {
        kind: "struct",
        fields: [
          {
            name: "agent_id",
            type: "u8",
          },
          {
            name: "old_x",
            type: "i32",
          },
          {
            name: "old_y",
            type: "i32",
          },
          {
            name: "new_x",
            type: "i32",
          },
          {
            name: "new_y",
            type: "i32",
          },
        ],
      },
    },
    {
      name: "Alliance",
      type: {
        kind: "struct",
        fields: [
          {
            name: "agent1",
            type: "pubkey",
          },
          {
            name: "agent2",
            type: "pubkey",
          },
          {
            name: "formed_at",
            type: "i64",
          },
          {
            name: "is_active",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "BattleInitiated",
      type: {
        kind: "struct",
        fields: [
          {
            name: "agent_id",
            type: "u8",
          },
          {
            name: "opponent_agent_id",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "BattleResolved",
      type: {
        kind: "struct",
        fields: [
          {
            name: "winner_id",
            type: "u8",
          },
          {
            name: "loser_id",
            type: "u8",
          },
          {
            name: "transfer_amount",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "CooldownInitiated",
      type: {
        kind: "struct",
        fields: [
          {
            name: "stake_info",
            type: "pubkey",
          },
          {
            name: "cooldown_ends_at",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "DailyRewardUpdated",
      docs: ["Optional events"],
      type: {
        kind: "struct",
        fields: [
          {
            name: "new_daily_reward",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "Game",
      type: {
        kind: "struct",
        fields: [
          {
            name: "game_id",
            type: "u64",
          },
          {
            name: "authority",
            type: "pubkey",
          },
          {
            name: "token_mint",
            type: "pubkey",
          },
          {
            name: "rewards_vault",
            type: "pubkey",
          },
          {
            name: "map_diameter",
            type: "u32",
          },
          {
            name: "is_active",
            type: "bool",
          },
          {
            name: "last_update",
            type: "i64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "daily_reward_tokens",
            type: "u64",
          },
          {
            name: "alliances",
            type: {
              vec: {
                defined: {
                  name: "Alliance",
                },
              },
            },
          },
          {
            name: "agents",
            type: {
              vec: {
                defined: {
                  name: "AgentInfo",
                },
              },
            },
          },
          {
            name: "total_stake_accounts",
            type: {
              vec: {
                defined: {
                  name: "StakerStake",
                },
              },
            },
          },
        ],
      },
    },
    {
      name: "StakeInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "agent",
            docs: ["The Agent (vault) this stake is associated with."],
            type: "pubkey",
          },
          {
            name: "staker",
            docs: ["The staker’s public key."],
            type: "pubkey",
          },
          {
            name: "amount",
            docs: ["The amount of tokens the user has deposited."],
            type: "u64",
          },
          {
            name: "shares",
            docs: ["The number of shares the user holds."],
            type: "u128",
          },
          {
            name: "last_reward_timestamp",
            docs: [
              "The last time (Unix timestamp) this staker claimed rewards.",
            ],
            type: "i64",
          },
          {
            name: "cooldown_ends_at",
            docs: ["The Unix timestamp when the cooldown ends."],
            type: "i64",
          },
          {
            name: "is_initialized",
            docs: [
              "Indicates whether the stake_info account has been initialized.",
            ],
            type: "bool",
          },
          {
            name: "__padding",
            docs: ["Padding to align to 8 bytes"],
            type: {
              array: ["u8", 7],
            },
          },
        ],
      },
    },
    {
      name: "StakerStake",
      type: {
        kind: "struct",
        fields: [
          {
            name: "staker",
            type: "pubkey",
          },
          {
            name: "total_stake",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "TerrainType",
      docs: [
        "Define terrain types that affect movement.",
        "Note: Make sure to declare the enum as public.",
      ],
      type: {
        kind: "enum",
        variants: [
          {
            name: "Plain",
          },
          {
            name: "Mountain",
          },
          {
            name: "River",
          },
        ],
      },
    },
  ],
};