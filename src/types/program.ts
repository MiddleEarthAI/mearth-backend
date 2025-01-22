import { BN } from "@coral-xyz/anchor";

export type MiddleEarthAiProgram = {
  version: "0.1.0";
  name: "middle_earth_ai_program";
  instructions: [
    {
      name: "initializeAgent";
      accounts: [
        {
          name: "agent";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "agentType";
          type: "string";
        },
        {
          name: "initialTokens";
          type: "u64";
        }
      ];
    },
    {
      name: "processBattle";
      accounts: [
        {
          name: "initiator";
          isMut: true;
          isSigner: false;
        },
        {
          name: "defender";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "tokensBurned";
          type: "u64";
        }
      ];
    },
    {
      name: "stake";
      accounts: [
        {
          name: "agent";
          isMut: true;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
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
      name: "updatePosition";
      accounts: [
        {
          name: "agent";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "x";
          type: "i64";
        },
        {
          name: "y";
          type: "i64";
        }
      ];
    },
    {
      name: "formAlliance";
      accounts: [
        {
          name: "agent1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "agent2";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "agent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "agentType";
            type: "string";
          },
          {
            name: "tokenBalance";
            type: "u64";
          },
          {
            name: "isAlive";
            type: "bool";
          },
          {
            name: "positionX";
            type: "i64";
          },
          {
            name: "positionY";
            type: "i64";
          },
          {
            name: "allianceWith";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "lastBattleTime";
            type: "i64";
          },
          {
            name: "lastAllianceTime";
            type: "i64";
          },
          {
            name: "authority";
            type: "publicKey";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "AgentNotFound";
      msg: "Agent account not found";
    },
    {
      code: 6001;
      name: "AgentNotAlive";
      msg: "Agent is not alive";
    },
    {
      code: 6002;
      name: "InsufficientTokens";
      msg: "Insufficient tokens for operation";
    },
    {
      code: 6003;
      name: "BattleCooldown";
      msg: "Agent is in battle cooldown";
    },
    {
      code: 6004;
      name: "AllianceCooldown";
      msg: "Agent is in alliance cooldown";
    }
  ];
};
