
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.2.1
 * Query Engine version: 4123509d24aa4dede1e864b46351bf2790323b69
 */
Prisma.prismaVersion = {
  client: "6.2.1",
  engine: "4123509d24aa4dede1e864b46351bf2790323b69"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.GameScalarFieldEnum = {
  id: 'id',
  onchainId: 'onchainId',
  authority: 'authority',
  pda: 'pda',
  tokenMint: 'tokenMint',
  rewardsVault: 'rewardsVault',
  mapDiameter: 'mapDiameter',
  isActive: 'isActive',
  lastUpdate: 'lastUpdate',
  bump: 'bump',
  dailyRewardTokens: 'dailyRewardTokens',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GameEventScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  eventType: 'eventType',
  initiatorId: 'initiatorId',
  targetId: 'targetId',
  message: 'message',
  metadata: 'metadata',
  gameId: 'gameId'
};

exports.Prisma.AgentProfileScalarFieldEnum = {
  id: 'id',
  onchainId: 'onchainId',
  name: 'name',
  xHandle: 'xHandle',
  followers: 'followers',
  bio: 'bio',
  lore: 'lore',
  characteristics: 'characteristics',
  knowledge: 'knowledge',
  traits: 'traits',
  postExamples: 'postExamples'
};

exports.Prisma.AgentScalarFieldEnum = {
  id: 'id',
  onchainId: 'onchainId',
  authority: 'authority',
  authorityAssociatedTokenAddress: 'authorityAssociatedTokenAddress',
  pda: 'pda',
  gameId: 'gameId',
  isAlive: 'isAlive',
  profileId: 'profileId',
  deathTimestamp: 'deathTimestamp',
  mapTileId: 'mapTileId'
};

exports.Prisma.IgnoreScalarFieldEnum = {
  id: 'id',
  agentId: 'agentId',
  timestamp: 'timestamp',
  duration: 'duration',
  gameId: 'gameId',
  ignoredAgentId: 'ignoredAgentId'
};

exports.Prisma.MapTileScalarFieldEnum = {
  id: 'id',
  x: 'x',
  y: 'y',
  terrainType: 'terrainType',
  agentId: 'agentId'
};

exports.Prisma.TweetScalarFieldEnum = {
  id: 'id',
  agentId: 'agentId',
  content: 'content',
  type: 'type',
  timestamp: 'timestamp',
  conversationId: 'conversationId'
};

exports.Prisma.AllianceScalarFieldEnum = {
  id: 'id',
  combinedTokens: 'combinedTokens',
  status: 'status',
  timestamp: 'timestamp',
  gameId: 'gameId',
  initiatorId: 'initiatorId',
  joinerId: 'joinerId',
  endedAt: 'endedAt'
};

exports.Prisma.BattleScalarFieldEnum = {
  id: 'id',
  type: 'type',
  status: 'status',
  tokensStaked: 'tokensStaked',
  startTime: 'startTime',
  endTime: 'endTime',
  gameId: 'gameId',
  attackerId: 'attackerId',
  defenderId: 'defenderId',
  attackerAllyId: 'attackerAllyId',
  defenderAllyId: 'defenderAllyId',
  winnerId: 'winnerId'
};

exports.Prisma.InteractionScalarFieldEnum = {
  id: 'id',
  tweetId: 'tweetId',
  userId: 'userId',
  type: 'type',
  content: 'content',
  timestamp: 'timestamp',
  userMetrics: 'userMetrics'
};

exports.Prisma.CoolDownScalarFieldEnum = {
  id: 'id',
  type: 'type',
  endsAt: 'endsAt',
  startsAt: 'startsAt',
  cooledAgentId: 'cooledAgentId',
  gameId: 'gameId'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  privyUserId: 'privyUserId',
  role: 'role',
  email: 'email',
  walletAddress: 'walletAddress',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GameLogScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  type: 'type',
  level: 'level',
  message: 'message',
  data: 'data',
  agentId: 'agentId',
  gameId: 'gameId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.EventType = exports.$Enums.EventType = {
  TWEET: 'TWEET',
  MOVE: 'MOVE',
  ALLIANCE_FORM: 'ALLIANCE_FORM',
  ALLIANCE_BREAK: 'ALLIANCE_BREAK',
  IGNORE: 'IGNORE',
  BATTLE: 'BATTLE',
  AGENT_DEATH: 'AGENT_DEATH'
};

exports.TerrainType = exports.$Enums.TerrainType = {
  plain: 'plain',
  mountain: 'mountain',
  river: 'river'
};

exports.AllianceStatus = exports.$Enums.AllianceStatus = {
  Active: 'Active',
  Pending: 'Pending',
  Broken: 'Broken'
};

exports.BattleType = exports.$Enums.BattleType = {
  Simple: 'Simple',
  AgentVsAlliance: 'AgentVsAlliance',
  AllianceVsAlliance: 'AllianceVsAlliance'
};

exports.BattleStatus = exports.$Enums.BattleStatus = {
  Active: 'Active',
  Resolved: 'Resolved',
  Cancelled: 'Cancelled'
};

exports.InteractionType = exports.$Enums.InteractionType = {
  Comment: 'Comment',
  Quote: 'Quote',
  Mention: 'Mention'
};

exports.CooldownType = exports.$Enums.CooldownType = {
  Alliance: 'Alliance',
  Battle: 'Battle',
  Ignore: 'Ignore',
  Move: 'Move'
};

exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER'
};

exports.Prisma.ModelName = {
  Game: 'Game',
  GameEvent: 'GameEvent',
  AgentProfile: 'AgentProfile',
  Agent: 'Agent',
  Ignore: 'Ignore',
  MapTile: 'MapTile',
  Tweet: 'Tweet',
  Alliance: 'Alliance',
  Battle: 'Battle',
  Interaction: 'Interaction',
  CoolDown: 'CoolDown',
  User: 'User',
  GameLog: 'GameLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
