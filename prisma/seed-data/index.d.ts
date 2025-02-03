
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Game
 * 
 */
export type Game = $Result.DefaultSelection<Prisma.$GamePayload>
/**
 * Model AgentProfile
 * 
 */
export type AgentProfile = $Result.DefaultSelection<Prisma.$AgentProfilePayload>
/**
 * Model Agent
 * 
 */
export type Agent = $Result.DefaultSelection<Prisma.$AgentPayload>
/**
 * Model Tweet
 * 
 */
export type Tweet = $Result.DefaultSelection<Prisma.$TweetPayload>
/**
 * Model Location
 * 
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>
/**
 * Model Alliance
 * 
 */
export type Alliance = $Result.DefaultSelection<Prisma.$AlliancePayload>
/**
 * Model Battle
 * 
 */
export type Battle = $Result.DefaultSelection<Prisma.$BattlePayload>
/**
 * Model Interaction
 * 
 */
export type Interaction = $Result.DefaultSelection<Prisma.$InteractionPayload>
/**
 * Model AgentState
 * 
 */
export type AgentState = $Result.DefaultSelection<Prisma.$AgentStatePayload>
/**
 * Model Cooldown
 * 
 */
export type Cooldown = $Result.DefaultSelection<Prisma.$CooldownPayload>
/**
 * Model Strategy
 * 
 */
export type Strategy = $Result.DefaultSelection<Prisma.$StrategyPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const TerrainType: {
  Plain: 'Plain',
  Mountain: 'Mountain',
  River: 'River'
};

export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType]


export const AllianceStatus: {
  Active: 'Active',
  Pending: 'Pending',
  Broken: 'Broken'
};

export type AllianceStatus = (typeof AllianceStatus)[keyof typeof AllianceStatus]


export const BattleStatus: {
  Active: 'Active',
  Resolved: 'Resolved',
  Failed: 'Failed'
};

export type BattleStatus = (typeof BattleStatus)[keyof typeof BattleStatus]


export const BattleType: {
  Simple: 'Simple',
  AgentVsAlliance: 'AgentVsAlliance',
  AllianceVsAlliance: 'AllianceVsAlliance'
};

export type BattleType = (typeof BattleType)[keyof typeof BattleType]


export const UserRole: {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const CooldownType: {
  Alliance: 'Alliance',
  Battle: 'Battle',
  Ignore: 'Ignore',
  Tweet: 'Tweet',
  Move: 'Move'
};

export type CooldownType = (typeof CooldownType)[keyof typeof CooldownType]

}

export type TerrainType = $Enums.TerrainType

export const TerrainType: typeof $Enums.TerrainType

export type AllianceStatus = $Enums.AllianceStatus

export const AllianceStatus: typeof $Enums.AllianceStatus

export type BattleStatus = $Enums.BattleStatus

export const BattleStatus: typeof $Enums.BattleStatus

export type BattleType = $Enums.BattleType

export const BattleType: typeof $Enums.BattleType

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type CooldownType = $Enums.CooldownType

export const CooldownType: typeof $Enums.CooldownType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Games
 * const games = await prisma.game.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Games
   * const games = await prisma.game.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs, $Utils.Call<Prisma.TypeMapCb, {
    extArgs: ExtArgs
  }>, ClientOptions>

      /**
   * `prisma.game`: Exposes CRUD operations for the **Game** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Games
    * const games = await prisma.game.findMany()
    * ```
    */
  get game(): Prisma.GameDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.agentProfile`: Exposes CRUD operations for the **AgentProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AgentProfiles
    * const agentProfiles = await prisma.agentProfile.findMany()
    * ```
    */
  get agentProfile(): Prisma.AgentProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.agent`: Exposes CRUD operations for the **Agent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Agents
    * const agents = await prisma.agent.findMany()
    * ```
    */
  get agent(): Prisma.AgentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tweet`: Exposes CRUD operations for the **Tweet** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tweets
    * const tweets = await prisma.tweet.findMany()
    * ```
    */
  get tweet(): Prisma.TweetDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locations
    * const locations = await prisma.location.findMany()
    * ```
    */
  get location(): Prisma.LocationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.alliance`: Exposes CRUD operations for the **Alliance** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Alliances
    * const alliances = await prisma.alliance.findMany()
    * ```
    */
  get alliance(): Prisma.AllianceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.battle`: Exposes CRUD operations for the **Battle** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Battles
    * const battles = await prisma.battle.findMany()
    * ```
    */
  get battle(): Prisma.BattleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.interaction`: Exposes CRUD operations for the **Interaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Interactions
    * const interactions = await prisma.interaction.findMany()
    * ```
    */
  get interaction(): Prisma.InteractionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.agentState`: Exposes CRUD operations for the **AgentState** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AgentStates
    * const agentStates = await prisma.agentState.findMany()
    * ```
    */
  get agentState(): Prisma.AgentStateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.cooldown`: Exposes CRUD operations for the **Cooldown** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Cooldowns
    * const cooldowns = await prisma.cooldown.findMany()
    * ```
    */
  get cooldown(): Prisma.CooldownDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.strategy`: Exposes CRUD operations for the **Strategy** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Strategies
    * const strategies = await prisma.strategy.findMany()
    * ```
    */
  get strategy(): Prisma.StrategyDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.2.1
   * Query Engine version: 4123509d24aa4dede1e864b46351bf2790323b69
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Game: 'Game',
    AgentProfile: 'AgentProfile',
    Agent: 'Agent',
    Tweet: 'Tweet',
    Location: 'Location',
    Alliance: 'Alliance',
    Battle: 'Battle',
    Interaction: 'Interaction',
    AgentState: 'AgentState',
    Cooldown: 'Cooldown',
    Strategy: 'Strategy',
    User: 'User'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "game" | "agentProfile" | "agent" | "tweet" | "location" | "alliance" | "battle" | "interaction" | "agentState" | "cooldown" | "strategy" | "user"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Game: {
        payload: Prisma.$GamePayload<ExtArgs>
        fields: Prisma.GameFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GameFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GameFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          findFirst: {
            args: Prisma.GameFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GameFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          findMany: {
            args: Prisma.GameFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>[]
          }
          create: {
            args: Prisma.GameCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          createMany: {
            args: Prisma.GameCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GameCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>[]
          }
          delete: {
            args: Prisma.GameDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          update: {
            args: Prisma.GameUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          deleteMany: {
            args: Prisma.GameDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GameUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GameUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>[]
          }
          upsert: {
            args: Prisma.GameUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          aggregate: {
            args: Prisma.GameAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGame>
          }
          groupBy: {
            args: Prisma.GameGroupByArgs<ExtArgs>
            result: $Utils.Optional<GameGroupByOutputType>[]
          }
          count: {
            args: Prisma.GameCountArgs<ExtArgs>
            result: $Utils.Optional<GameCountAggregateOutputType> | number
          }
        }
      }
      AgentProfile: {
        payload: Prisma.$AgentProfilePayload<ExtArgs>
        fields: Prisma.AgentProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgentProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>
          }
          findFirst: {
            args: Prisma.AgentProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>
          }
          findMany: {
            args: Prisma.AgentProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>[]
          }
          create: {
            args: Prisma.AgentProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>
          }
          createMany: {
            args: Prisma.AgentProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AgentProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>[]
          }
          delete: {
            args: Prisma.AgentProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>
          }
          update: {
            args: Prisma.AgentProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>
          }
          deleteMany: {
            args: Prisma.AgentProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgentProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AgentProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>[]
          }
          upsert: {
            args: Prisma.AgentProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentProfilePayload>
          }
          aggregate: {
            args: Prisma.AgentProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgentProfile>
          }
          groupBy: {
            args: Prisma.AgentProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgentProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentProfileCountArgs<ExtArgs>
            result: $Utils.Optional<AgentProfileCountAggregateOutputType> | number
          }
        }
      }
      Agent: {
        payload: Prisma.$AgentPayload<ExtArgs>
        fields: Prisma.AgentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          findFirst: {
            args: Prisma.AgentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          findMany: {
            args: Prisma.AgentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>[]
          }
          create: {
            args: Prisma.AgentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          createMany: {
            args: Prisma.AgentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AgentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>[]
          }
          delete: {
            args: Prisma.AgentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          update: {
            args: Prisma.AgentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          deleteMany: {
            args: Prisma.AgentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AgentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>[]
          }
          upsert: {
            args: Prisma.AgentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          aggregate: {
            args: Prisma.AgentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgent>
          }
          groupBy: {
            args: Prisma.AgentGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgentGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentCountArgs<ExtArgs>
            result: $Utils.Optional<AgentCountAggregateOutputType> | number
          }
        }
      }
      Tweet: {
        payload: Prisma.$TweetPayload<ExtArgs>
        fields: Prisma.TweetFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TweetFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TweetFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>
          }
          findFirst: {
            args: Prisma.TweetFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TweetFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>
          }
          findMany: {
            args: Prisma.TweetFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>[]
          }
          create: {
            args: Prisma.TweetCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>
          }
          createMany: {
            args: Prisma.TweetCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TweetCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>[]
          }
          delete: {
            args: Prisma.TweetDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>
          }
          update: {
            args: Prisma.TweetUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>
          }
          deleteMany: {
            args: Prisma.TweetDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TweetUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TweetUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>[]
          }
          upsert: {
            args: Prisma.TweetUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TweetPayload>
          }
          aggregate: {
            args: Prisma.TweetAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTweet>
          }
          groupBy: {
            args: Prisma.TweetGroupByArgs<ExtArgs>
            result: $Utils.Optional<TweetGroupByOutputType>[]
          }
          count: {
            args: Prisma.TweetCountArgs<ExtArgs>
            result: $Utils.Optional<TweetCountAggregateOutputType> | number
          }
        }
      }
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>
        fields: Prisma.LocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LocationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocation>
          }
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>
            result: $Utils.Optional<LocationCountAggregateOutputType> | number
          }
        }
      }
      Alliance: {
        payload: Prisma.$AlliancePayload<ExtArgs>
        fields: Prisma.AllianceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AllianceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AllianceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>
          }
          findFirst: {
            args: Prisma.AllianceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AllianceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>
          }
          findMany: {
            args: Prisma.AllianceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>[]
          }
          create: {
            args: Prisma.AllianceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>
          }
          createMany: {
            args: Prisma.AllianceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AllianceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>[]
          }
          delete: {
            args: Prisma.AllianceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>
          }
          update: {
            args: Prisma.AllianceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>
          }
          deleteMany: {
            args: Prisma.AllianceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AllianceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AllianceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>[]
          }
          upsert: {
            args: Prisma.AllianceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlliancePayload>
          }
          aggregate: {
            args: Prisma.AllianceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAlliance>
          }
          groupBy: {
            args: Prisma.AllianceGroupByArgs<ExtArgs>
            result: $Utils.Optional<AllianceGroupByOutputType>[]
          }
          count: {
            args: Prisma.AllianceCountArgs<ExtArgs>
            result: $Utils.Optional<AllianceCountAggregateOutputType> | number
          }
        }
      }
      Battle: {
        payload: Prisma.$BattlePayload<ExtArgs>
        fields: Prisma.BattleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BattleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BattleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>
          }
          findFirst: {
            args: Prisma.BattleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BattleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>
          }
          findMany: {
            args: Prisma.BattleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>[]
          }
          create: {
            args: Prisma.BattleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>
          }
          createMany: {
            args: Prisma.BattleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BattleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>[]
          }
          delete: {
            args: Prisma.BattleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>
          }
          update: {
            args: Prisma.BattleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>
          }
          deleteMany: {
            args: Prisma.BattleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BattleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BattleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>[]
          }
          upsert: {
            args: Prisma.BattleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattlePayload>
          }
          aggregate: {
            args: Prisma.BattleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBattle>
          }
          groupBy: {
            args: Prisma.BattleGroupByArgs<ExtArgs>
            result: $Utils.Optional<BattleGroupByOutputType>[]
          }
          count: {
            args: Prisma.BattleCountArgs<ExtArgs>
            result: $Utils.Optional<BattleCountAggregateOutputType> | number
          }
        }
      }
      Interaction: {
        payload: Prisma.$InteractionPayload<ExtArgs>
        fields: Prisma.InteractionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InteractionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InteractionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          findFirst: {
            args: Prisma.InteractionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InteractionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          findMany: {
            args: Prisma.InteractionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>[]
          }
          create: {
            args: Prisma.InteractionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          createMany: {
            args: Prisma.InteractionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InteractionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>[]
          }
          delete: {
            args: Prisma.InteractionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          update: {
            args: Prisma.InteractionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          deleteMany: {
            args: Prisma.InteractionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InteractionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InteractionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>[]
          }
          upsert: {
            args: Prisma.InteractionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InteractionPayload>
          }
          aggregate: {
            args: Prisma.InteractionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInteraction>
          }
          groupBy: {
            args: Prisma.InteractionGroupByArgs<ExtArgs>
            result: $Utils.Optional<InteractionGroupByOutputType>[]
          }
          count: {
            args: Prisma.InteractionCountArgs<ExtArgs>
            result: $Utils.Optional<InteractionCountAggregateOutputType> | number
          }
        }
      }
      AgentState: {
        payload: Prisma.$AgentStatePayload<ExtArgs>
        fields: Prisma.AgentStateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgentStateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentStateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>
          }
          findFirst: {
            args: Prisma.AgentStateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentStateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>
          }
          findMany: {
            args: Prisma.AgentStateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>[]
          }
          create: {
            args: Prisma.AgentStateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>
          }
          createMany: {
            args: Prisma.AgentStateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AgentStateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>[]
          }
          delete: {
            args: Prisma.AgentStateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>
          }
          update: {
            args: Prisma.AgentStateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>
          }
          deleteMany: {
            args: Prisma.AgentStateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgentStateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AgentStateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>[]
          }
          upsert: {
            args: Prisma.AgentStateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentStatePayload>
          }
          aggregate: {
            args: Prisma.AgentStateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgentState>
          }
          groupBy: {
            args: Prisma.AgentStateGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgentStateGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentStateCountArgs<ExtArgs>
            result: $Utils.Optional<AgentStateCountAggregateOutputType> | number
          }
        }
      }
      Cooldown: {
        payload: Prisma.$CooldownPayload<ExtArgs>
        fields: Prisma.CooldownFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CooldownFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CooldownFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>
          }
          findFirst: {
            args: Prisma.CooldownFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CooldownFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>
          }
          findMany: {
            args: Prisma.CooldownFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>[]
          }
          create: {
            args: Prisma.CooldownCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>
          }
          createMany: {
            args: Prisma.CooldownCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CooldownCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>[]
          }
          delete: {
            args: Prisma.CooldownDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>
          }
          update: {
            args: Prisma.CooldownUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>
          }
          deleteMany: {
            args: Prisma.CooldownDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CooldownUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CooldownUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>[]
          }
          upsert: {
            args: Prisma.CooldownUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CooldownPayload>
          }
          aggregate: {
            args: Prisma.CooldownAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCooldown>
          }
          groupBy: {
            args: Prisma.CooldownGroupByArgs<ExtArgs>
            result: $Utils.Optional<CooldownGroupByOutputType>[]
          }
          count: {
            args: Prisma.CooldownCountArgs<ExtArgs>
            result: $Utils.Optional<CooldownCountAggregateOutputType> | number
          }
        }
      }
      Strategy: {
        payload: Prisma.$StrategyPayload<ExtArgs>
        fields: Prisma.StrategyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StrategyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StrategyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>
          }
          findFirst: {
            args: Prisma.StrategyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StrategyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>
          }
          findMany: {
            args: Prisma.StrategyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>[]
          }
          create: {
            args: Prisma.StrategyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>
          }
          createMany: {
            args: Prisma.StrategyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StrategyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>[]
          }
          delete: {
            args: Prisma.StrategyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>
          }
          update: {
            args: Prisma.StrategyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>
          }
          deleteMany: {
            args: Prisma.StrategyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StrategyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StrategyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>[]
          }
          upsert: {
            args: Prisma.StrategyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StrategyPayload>
          }
          aggregate: {
            args: Prisma.StrategyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStrategy>
          }
          groupBy: {
            args: Prisma.StrategyGroupByArgs<ExtArgs>
            result: $Utils.Optional<StrategyGroupByOutputType>[]
          }
          count: {
            args: Prisma.StrategyCountArgs<ExtArgs>
            result: $Utils.Optional<StrategyCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    game?: GameOmit
    agentProfile?: AgentProfileOmit
    agent?: AgentOmit
    tweet?: TweetOmit
    location?: LocationOmit
    alliance?: AllianceOmit
    battle?: BattleOmit
    interaction?: InteractionOmit
    agentState?: AgentStateOmit
    cooldown?: CooldownOmit
    strategy?: StrategyOmit
    user?: UserOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type GameCountOutputType
   */

  export type GameCountOutputType = {
    agents: number
    alliances: number
    battles: number
    Cooldown: number
  }

  export type GameCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agents?: boolean | GameCountOutputTypeCountAgentsArgs
    alliances?: boolean | GameCountOutputTypeCountAlliancesArgs
    battles?: boolean | GameCountOutputTypeCountBattlesArgs
    Cooldown?: boolean | GameCountOutputTypeCountCooldownArgs
  }

  // Custom InputTypes
  /**
   * GameCountOutputType without action
   */
  export type GameCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameCountOutputType
     */
    select?: GameCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GameCountOutputType without action
   */
  export type GameCountOutputTypeCountAgentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentWhereInput
  }

  /**
   * GameCountOutputType without action
   */
  export type GameCountOutputTypeCountAlliancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AllianceWhereInput
  }

  /**
   * GameCountOutputType without action
   */
  export type GameCountOutputTypeCountBattlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BattleWhereInput
  }

  /**
   * GameCountOutputType without action
   */
  export type GameCountOutputTypeCountCooldownArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CooldownWhereInput
  }


  /**
   * Count Type AgentProfileCountOutputType
   */

  export type AgentProfileCountOutputType = {
    agent: number
  }

  export type AgentProfileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentProfileCountOutputTypeCountAgentArgs
  }

  // Custom InputTypes
  /**
   * AgentProfileCountOutputType without action
   */
  export type AgentProfileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfileCountOutputType
     */
    select?: AgentProfileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AgentProfileCountOutputType without action
   */
  export type AgentProfileCountOutputTypeCountAgentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentWhereInput
  }


  /**
   * Count Type AgentCountOutputType
   */

  export type AgentCountOutputType = {
    battles: number
    cooldowns: number
    alliedBy: number
    battlesAsOpponent: number
    Tweet: number
  }

  export type AgentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    battles?: boolean | AgentCountOutputTypeCountBattlesArgs
    cooldowns?: boolean | AgentCountOutputTypeCountCooldownsArgs
    alliedBy?: boolean | AgentCountOutputTypeCountAlliedByArgs
    battlesAsOpponent?: boolean | AgentCountOutputTypeCountBattlesAsOpponentArgs
    Tweet?: boolean | AgentCountOutputTypeCountTweetArgs
  }

  // Custom InputTypes
  /**
   * AgentCountOutputType without action
   */
  export type AgentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentCountOutputType
     */
    select?: AgentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AgentCountOutputType without action
   */
  export type AgentCountOutputTypeCountBattlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BattleWhereInput
  }

  /**
   * AgentCountOutputType without action
   */
  export type AgentCountOutputTypeCountCooldownsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CooldownWhereInput
  }

  /**
   * AgentCountOutputType without action
   */
  export type AgentCountOutputTypeCountAlliedByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AllianceWhereInput
  }

  /**
   * AgentCountOutputType without action
   */
  export type AgentCountOutputTypeCountBattlesAsOpponentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BattleWhereInput
  }

  /**
   * AgentCountOutputType without action
   */
  export type AgentCountOutputTypeCountTweetArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TweetWhereInput
  }


  /**
   * Count Type TweetCountOutputType
   */

  export type TweetCountOutputType = {
    interactions: number
  }

  export type TweetCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    interactions?: boolean | TweetCountOutputTypeCountInteractionsArgs
  }

  // Custom InputTypes
  /**
   * TweetCountOutputType without action
   */
  export type TweetCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TweetCountOutputType
     */
    select?: TweetCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TweetCountOutputType without action
   */
  export type TweetCountOutputTypeCountInteractionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InteractionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Game
   */

  export type AggregateGame = {
    _count: GameCountAggregateOutputType | null
    _avg: GameAvgAggregateOutputType | null
    _sum: GameSumAggregateOutputType | null
    _min: GameMinAggregateOutputType | null
    _max: GameMaxAggregateOutputType | null
  }

  export type GameAvgAggregateOutputType = {
    gameId: number | null
    mapDiameter: number | null
    bump: number | null
    dailyRewardTokens: number | null
  }

  export type GameSumAggregateOutputType = {
    gameId: bigint | null
    mapDiameter: number | null
    bump: number | null
    dailyRewardTokens: number | null
  }

  export type GameMinAggregateOutputType = {
    id: string | null
    gameId: bigint | null
    authority: string | null
    tokenMint: string | null
    rewardsVault: string | null
    mapDiameter: number | null
    isActive: boolean | null
    lastUpdate: Date | null
    bump: number | null
    dailyRewardTokens: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type GameMaxAggregateOutputType = {
    id: string | null
    gameId: bigint | null
    authority: string | null
    tokenMint: string | null
    rewardsVault: string | null
    mapDiameter: number | null
    isActive: boolean | null
    lastUpdate: Date | null
    bump: number | null
    dailyRewardTokens: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type GameCountAggregateOutputType = {
    id: number
    gameId: number
    authority: number
    tokenMint: number
    rewardsVault: number
    mapDiameter: number
    isActive: number
    lastUpdate: number
    bump: number
    dailyRewardTokens: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type GameAvgAggregateInputType = {
    gameId?: true
    mapDiameter?: true
    bump?: true
    dailyRewardTokens?: true
  }

  export type GameSumAggregateInputType = {
    gameId?: true
    mapDiameter?: true
    bump?: true
    dailyRewardTokens?: true
  }

  export type GameMinAggregateInputType = {
    id?: true
    gameId?: true
    authority?: true
    tokenMint?: true
    rewardsVault?: true
    mapDiameter?: true
    isActive?: true
    lastUpdate?: true
    bump?: true
    dailyRewardTokens?: true
    createdAt?: true
    updatedAt?: true
  }

  export type GameMaxAggregateInputType = {
    id?: true
    gameId?: true
    authority?: true
    tokenMint?: true
    rewardsVault?: true
    mapDiameter?: true
    isActive?: true
    lastUpdate?: true
    bump?: true
    dailyRewardTokens?: true
    createdAt?: true
    updatedAt?: true
  }

  export type GameCountAggregateInputType = {
    id?: true
    gameId?: true
    authority?: true
    tokenMint?: true
    rewardsVault?: true
    mapDiameter?: true
    isActive?: true
    lastUpdate?: true
    bump?: true
    dailyRewardTokens?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type GameAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Game to aggregate.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Games.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Games
    **/
    _count?: true | GameCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GameAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GameSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GameMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GameMaxAggregateInputType
  }

  export type GetGameAggregateType<T extends GameAggregateArgs> = {
        [P in keyof T & keyof AggregateGame]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGame[P]>
      : GetScalarType<T[P], AggregateGame[P]>
  }




  export type GameGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameWhereInput
    orderBy?: GameOrderByWithAggregationInput | GameOrderByWithAggregationInput[]
    by: GameScalarFieldEnum[] | GameScalarFieldEnum
    having?: GameScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GameCountAggregateInputType | true
    _avg?: GameAvgAggregateInputType
    _sum?: GameSumAggregateInputType
    _min?: GameMinAggregateInputType
    _max?: GameMaxAggregateInputType
  }

  export type GameGroupByOutputType = {
    id: string
    gameId: bigint
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive: boolean
    lastUpdate: Date
    bump: number
    dailyRewardTokens: number
    createdAt: Date
    updatedAt: Date
    _count: GameCountAggregateOutputType | null
    _avg: GameAvgAggregateOutputType | null
    _sum: GameSumAggregateOutputType | null
    _min: GameMinAggregateOutputType | null
    _max: GameMaxAggregateOutputType | null
  }

  type GetGameGroupByPayload<T extends GameGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GameGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GameGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GameGroupByOutputType[P]>
            : GetScalarType<T[P], GameGroupByOutputType[P]>
        }
      >
    >


  export type GameSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameId?: boolean
    authority?: boolean
    tokenMint?: boolean
    rewardsVault?: boolean
    mapDiameter?: boolean
    isActive?: boolean
    lastUpdate?: boolean
    bump?: boolean
    dailyRewardTokens?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    agents?: boolean | Game$agentsArgs<ExtArgs>
    alliances?: boolean | Game$alliancesArgs<ExtArgs>
    battles?: boolean | Game$battlesArgs<ExtArgs>
    Cooldown?: boolean | Game$CooldownArgs<ExtArgs>
    _count?: boolean | GameCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["game"]>

  export type GameSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameId?: boolean
    authority?: boolean
    tokenMint?: boolean
    rewardsVault?: boolean
    mapDiameter?: boolean
    isActive?: boolean
    lastUpdate?: boolean
    bump?: boolean
    dailyRewardTokens?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["game"]>

  export type GameSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameId?: boolean
    authority?: boolean
    tokenMint?: boolean
    rewardsVault?: boolean
    mapDiameter?: boolean
    isActive?: boolean
    lastUpdate?: boolean
    bump?: boolean
    dailyRewardTokens?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["game"]>

  export type GameSelectScalar = {
    id?: boolean
    gameId?: boolean
    authority?: boolean
    tokenMint?: boolean
    rewardsVault?: boolean
    mapDiameter?: boolean
    isActive?: boolean
    lastUpdate?: boolean
    bump?: boolean
    dailyRewardTokens?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type GameOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "gameId" | "authority" | "tokenMint" | "rewardsVault" | "mapDiameter" | "isActive" | "lastUpdate" | "bump" | "dailyRewardTokens" | "createdAt" | "updatedAt", ExtArgs["result"]["game"]>
  export type GameInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agents?: boolean | Game$agentsArgs<ExtArgs>
    alliances?: boolean | Game$alliancesArgs<ExtArgs>
    battles?: boolean | Game$battlesArgs<ExtArgs>
    Cooldown?: boolean | Game$CooldownArgs<ExtArgs>
    _count?: boolean | GameCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GameIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type GameIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $GamePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Game"
    objects: {
      agents: Prisma.$AgentPayload<ExtArgs>[]
      alliances: Prisma.$AlliancePayload<ExtArgs>[]
      battles: Prisma.$BattlePayload<ExtArgs>[]
      Cooldown: Prisma.$CooldownPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      gameId: bigint
      authority: string
      tokenMint: string
      rewardsVault: string
      mapDiameter: number
      isActive: boolean
      lastUpdate: Date
      bump: number
      dailyRewardTokens: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["game"]>
    composites: {}
  }

  type GameGetPayload<S extends boolean | null | undefined | GameDefaultArgs> = $Result.GetResult<Prisma.$GamePayload, S>

  type GameCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GameFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GameCountAggregateInputType | true
    }

  export interface GameDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Game'], meta: { name: 'Game' } }
    /**
     * Find zero or one Game that matches the filter.
     * @param {GameFindUniqueArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GameFindUniqueArgs>(args: SelectSubset<T, GameFindUniqueArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Game that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GameFindUniqueOrThrowArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GameFindUniqueOrThrowArgs>(args: SelectSubset<T, GameFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Game that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameFindFirstArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GameFindFirstArgs>(args?: SelectSubset<T, GameFindFirstArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Game that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameFindFirstOrThrowArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GameFindFirstOrThrowArgs>(args?: SelectSubset<T, GameFindFirstOrThrowArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Games that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Games
     * const games = await prisma.game.findMany()
     * 
     * // Get first 10 Games
     * const games = await prisma.game.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const gameWithIdOnly = await prisma.game.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GameFindManyArgs>(args?: SelectSubset<T, GameFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Game.
     * @param {GameCreateArgs} args - Arguments to create a Game.
     * @example
     * // Create one Game
     * const Game = await prisma.game.create({
     *   data: {
     *     // ... data to create a Game
     *   }
     * })
     * 
     */
    create<T extends GameCreateArgs>(args: SelectSubset<T, GameCreateArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Games.
     * @param {GameCreateManyArgs} args - Arguments to create many Games.
     * @example
     * // Create many Games
     * const game = await prisma.game.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GameCreateManyArgs>(args?: SelectSubset<T, GameCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Games and returns the data saved in the database.
     * @param {GameCreateManyAndReturnArgs} args - Arguments to create many Games.
     * @example
     * // Create many Games
     * const game = await prisma.game.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Games and only return the `id`
     * const gameWithIdOnly = await prisma.game.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GameCreateManyAndReturnArgs>(args?: SelectSubset<T, GameCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Game.
     * @param {GameDeleteArgs} args - Arguments to delete one Game.
     * @example
     * // Delete one Game
     * const Game = await prisma.game.delete({
     *   where: {
     *     // ... filter to delete one Game
     *   }
     * })
     * 
     */
    delete<T extends GameDeleteArgs>(args: SelectSubset<T, GameDeleteArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Game.
     * @param {GameUpdateArgs} args - Arguments to update one Game.
     * @example
     * // Update one Game
     * const game = await prisma.game.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GameUpdateArgs>(args: SelectSubset<T, GameUpdateArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Games.
     * @param {GameDeleteManyArgs} args - Arguments to filter Games to delete.
     * @example
     * // Delete a few Games
     * const { count } = await prisma.game.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GameDeleteManyArgs>(args?: SelectSubset<T, GameDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Games.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Games
     * const game = await prisma.game.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GameUpdateManyArgs>(args: SelectSubset<T, GameUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Games and returns the data updated in the database.
     * @param {GameUpdateManyAndReturnArgs} args - Arguments to update many Games.
     * @example
     * // Update many Games
     * const game = await prisma.game.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Games and only return the `id`
     * const gameWithIdOnly = await prisma.game.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GameUpdateManyAndReturnArgs>(args: SelectSubset<T, GameUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Game.
     * @param {GameUpsertArgs} args - Arguments to update or create a Game.
     * @example
     * // Update or create a Game
     * const game = await prisma.game.upsert({
     *   create: {
     *     // ... data to create a Game
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Game we want to update
     *   }
     * })
     */
    upsert<T extends GameUpsertArgs>(args: SelectSubset<T, GameUpsertArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Games.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameCountArgs} args - Arguments to filter Games to count.
     * @example
     * // Count the number of Games
     * const count = await prisma.game.count({
     *   where: {
     *     // ... the filter for the Games we want to count
     *   }
     * })
    **/
    count<T extends GameCountArgs>(
      args?: Subset<T, GameCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GameCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Game.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GameAggregateArgs>(args: Subset<T, GameAggregateArgs>): Prisma.PrismaPromise<GetGameAggregateType<T>>

    /**
     * Group by Game.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GameGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GameGroupByArgs['orderBy'] }
        : { orderBy?: GameGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GameGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGameGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Game model
   */
  readonly fields: GameFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Game.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GameClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agents<T extends Game$agentsArgs<ExtArgs> = {}>(args?: Subset<T, Game$agentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    alliances<T extends Game$alliancesArgs<ExtArgs> = {}>(args?: Subset<T, Game$alliancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    battles<T extends Game$battlesArgs<ExtArgs> = {}>(args?: Subset<T, Game$battlesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    Cooldown<T extends Game$CooldownArgs<ExtArgs> = {}>(args?: Subset<T, Game$CooldownArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Game model
   */ 
  interface GameFieldRefs {
    readonly id: FieldRef<"Game", 'String'>
    readonly gameId: FieldRef<"Game", 'BigInt'>
    readonly authority: FieldRef<"Game", 'String'>
    readonly tokenMint: FieldRef<"Game", 'String'>
    readonly rewardsVault: FieldRef<"Game", 'String'>
    readonly mapDiameter: FieldRef<"Game", 'Int'>
    readonly isActive: FieldRef<"Game", 'Boolean'>
    readonly lastUpdate: FieldRef<"Game", 'DateTime'>
    readonly bump: FieldRef<"Game", 'Int'>
    readonly dailyRewardTokens: FieldRef<"Game", 'Float'>
    readonly createdAt: FieldRef<"Game", 'DateTime'>
    readonly updatedAt: FieldRef<"Game", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Game findUnique
   */
  export type GameFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game findUniqueOrThrow
   */
  export type GameFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game findFirst
   */
  export type GameFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Games.
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Games.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Games.
     */
    distinct?: GameScalarFieldEnum | GameScalarFieldEnum[]
  }

  /**
   * Game findFirstOrThrow
   */
  export type GameFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Games.
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Games.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Games.
     */
    distinct?: GameScalarFieldEnum | GameScalarFieldEnum[]
  }

  /**
   * Game findMany
   */
  export type GameFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Games to fetch.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Games.
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Games.
     */
    skip?: number
    distinct?: GameScalarFieldEnum | GameScalarFieldEnum[]
  }

  /**
   * Game create
   */
  export type GameCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * The data needed to create a Game.
     */
    data: XOR<GameCreateInput, GameUncheckedCreateInput>
  }

  /**
   * Game createMany
   */
  export type GameCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Games.
     */
    data: GameCreateManyInput | GameCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Game createManyAndReturn
   */
  export type GameCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * The data used to create many Games.
     */
    data: GameCreateManyInput | GameCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Game update
   */
  export type GameUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * The data needed to update a Game.
     */
    data: XOR<GameUpdateInput, GameUncheckedUpdateInput>
    /**
     * Choose, which Game to update.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game updateMany
   */
  export type GameUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Games.
     */
    data: XOR<GameUpdateManyMutationInput, GameUncheckedUpdateManyInput>
    /**
     * Filter which Games to update
     */
    where?: GameWhereInput
  }

  /**
   * Game updateManyAndReturn
   */
  export type GameUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * The data used to update Games.
     */
    data: XOR<GameUpdateManyMutationInput, GameUncheckedUpdateManyInput>
    /**
     * Filter which Games to update
     */
    where?: GameWhereInput
  }

  /**
   * Game upsert
   */
  export type GameUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * The filter to search for the Game to update in case it exists.
     */
    where: GameWhereUniqueInput
    /**
     * In case the Game found by the `where` argument doesn't exist, create a new Game with this data.
     */
    create: XOR<GameCreateInput, GameUncheckedCreateInput>
    /**
     * In case the Game was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GameUpdateInput, GameUncheckedUpdateInput>
  }

  /**
   * Game delete
   */
  export type GameDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter which Game to delete.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game deleteMany
   */
  export type GameDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Games to delete
     */
    where?: GameWhereInput
  }

  /**
   * Game.agents
   */
  export type Game$agentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    where?: AgentWhereInput
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    cursor?: AgentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * Game.alliances
   */
  export type Game$alliancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    where?: AllianceWhereInput
    orderBy?: AllianceOrderByWithRelationInput | AllianceOrderByWithRelationInput[]
    cursor?: AllianceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AllianceScalarFieldEnum | AllianceScalarFieldEnum[]
  }

  /**
   * Game.battles
   */
  export type Game$battlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    where?: BattleWhereInput
    orderBy?: BattleOrderByWithRelationInput | BattleOrderByWithRelationInput[]
    cursor?: BattleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BattleScalarFieldEnum | BattleScalarFieldEnum[]
  }

  /**
   * Game.Cooldown
   */
  export type Game$CooldownArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    where?: CooldownWhereInput
    orderBy?: CooldownOrderByWithRelationInput | CooldownOrderByWithRelationInput[]
    cursor?: CooldownWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CooldownScalarFieldEnum | CooldownScalarFieldEnum[]
  }

  /**
   * Game without action
   */
  export type GameDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
  }


  /**
   * Model AgentProfile
   */

  export type AggregateAgentProfile = {
    _count: AgentProfileCountAggregateOutputType | null
    _avg: AgentProfileAvgAggregateOutputType | null
    _sum: AgentProfileSumAggregateOutputType | null
    _min: AgentProfileMinAggregateOutputType | null
    _max: AgentProfileMaxAggregateOutputType | null
  }

  export type AgentProfileAvgAggregateOutputType = {
    onchainId: number | null
  }

  export type AgentProfileSumAggregateOutputType = {
    onchainId: number | null
  }

  export type AgentProfileMinAggregateOutputType = {
    id: string | null
    onchainId: number | null
    name: string | null
    xHandle: string | null
  }

  export type AgentProfileMaxAggregateOutputType = {
    id: string | null
    onchainId: number | null
    name: string | null
    xHandle: string | null
  }

  export type AgentProfileCountAggregateOutputType = {
    id: number
    onchainId: number
    name: number
    xHandle: number
    bio: number
    lore: number
    characteristics: number
    knowledge: number
    traits: number
    _all: number
  }


  export type AgentProfileAvgAggregateInputType = {
    onchainId?: true
  }

  export type AgentProfileSumAggregateInputType = {
    onchainId?: true
  }

  export type AgentProfileMinAggregateInputType = {
    id?: true
    onchainId?: true
    name?: true
    xHandle?: true
  }

  export type AgentProfileMaxAggregateInputType = {
    id?: true
    onchainId?: true
    name?: true
    xHandle?: true
  }

  export type AgentProfileCountAggregateInputType = {
    id?: true
    onchainId?: true
    name?: true
    xHandle?: true
    bio?: true
    lore?: true
    characteristics?: true
    knowledge?: true
    traits?: true
    _all?: true
  }

  export type AgentProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentProfile to aggregate.
     */
    where?: AgentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentProfiles to fetch.
     */
    orderBy?: AgentProfileOrderByWithRelationInput | AgentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AgentProfiles
    **/
    _count?: true | AgentProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AgentProfileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AgentProfileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentProfileMaxAggregateInputType
  }

  export type GetAgentProfileAggregateType<T extends AgentProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateAgentProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgentProfile[P]>
      : GetScalarType<T[P], AggregateAgentProfile[P]>
  }




  export type AgentProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentProfileWhereInput
    orderBy?: AgentProfileOrderByWithAggregationInput | AgentProfileOrderByWithAggregationInput[]
    by: AgentProfileScalarFieldEnum[] | AgentProfileScalarFieldEnum
    having?: AgentProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentProfileCountAggregateInputType | true
    _avg?: AgentProfileAvgAggregateInputType
    _sum?: AgentProfileSumAggregateInputType
    _min?: AgentProfileMinAggregateInputType
    _max?: AgentProfileMaxAggregateInputType
  }

  export type AgentProfileGroupByOutputType = {
    id: string
    onchainId: number
    name: string
    xHandle: string
    bio: string[]
    lore: string[]
    characteristics: string[]
    knowledge: string[]
    traits: JsonValue
    _count: AgentProfileCountAggregateOutputType | null
    _avg: AgentProfileAvgAggregateOutputType | null
    _sum: AgentProfileSumAggregateOutputType | null
    _min: AgentProfileMinAggregateOutputType | null
    _max: AgentProfileMaxAggregateOutputType | null
  }

  type GetAgentProfileGroupByPayload<T extends AgentProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgentProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentProfileGroupByOutputType[P]>
            : GetScalarType<T[P], AgentProfileGroupByOutputType[P]>
        }
      >
    >


  export type AgentProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    onchainId?: boolean
    name?: boolean
    xHandle?: boolean
    bio?: boolean
    lore?: boolean
    characteristics?: boolean
    knowledge?: boolean
    traits?: boolean
    agent?: boolean | AgentProfile$agentArgs<ExtArgs>
    _count?: boolean | AgentProfileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentProfile"]>

  export type AgentProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    onchainId?: boolean
    name?: boolean
    xHandle?: boolean
    bio?: boolean
    lore?: boolean
    characteristics?: boolean
    knowledge?: boolean
    traits?: boolean
  }, ExtArgs["result"]["agentProfile"]>

  export type AgentProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    onchainId?: boolean
    name?: boolean
    xHandle?: boolean
    bio?: boolean
    lore?: boolean
    characteristics?: boolean
    knowledge?: boolean
    traits?: boolean
  }, ExtArgs["result"]["agentProfile"]>

  export type AgentProfileSelectScalar = {
    id?: boolean
    onchainId?: boolean
    name?: boolean
    xHandle?: boolean
    bio?: boolean
    lore?: boolean
    characteristics?: boolean
    knowledge?: boolean
    traits?: boolean
  }

  export type AgentProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "onchainId" | "name" | "xHandle" | "bio" | "lore" | "characteristics" | "knowledge" | "traits", ExtArgs["result"]["agentProfile"]>
  export type AgentProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentProfile$agentArgs<ExtArgs>
    _count?: boolean | AgentProfileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AgentProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AgentProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AgentProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AgentProfile"
    objects: {
      agent: Prisma.$AgentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      onchainId: number
      name: string
      xHandle: string
      bio: string[]
      lore: string[]
      characteristics: string[]
      knowledge: string[]
      traits: Prisma.JsonValue
    }, ExtArgs["result"]["agentProfile"]>
    composites: {}
  }

  type AgentProfileGetPayload<S extends boolean | null | undefined | AgentProfileDefaultArgs> = $Result.GetResult<Prisma.$AgentProfilePayload, S>

  type AgentProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AgentProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AgentProfileCountAggregateInputType | true
    }

  export interface AgentProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AgentProfile'], meta: { name: 'AgentProfile' } }
    /**
     * Find zero or one AgentProfile that matches the filter.
     * @param {AgentProfileFindUniqueArgs} args - Arguments to find a AgentProfile
     * @example
     * // Get one AgentProfile
     * const agentProfile = await prisma.agentProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgentProfileFindUniqueArgs>(args: SelectSubset<T, AgentProfileFindUniqueArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one AgentProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AgentProfileFindUniqueOrThrowArgs} args - Arguments to find a AgentProfile
     * @example
     * // Get one AgentProfile
     * const agentProfile = await prisma.agentProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgentProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, AgentProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first AgentProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentProfileFindFirstArgs} args - Arguments to find a AgentProfile
     * @example
     * // Get one AgentProfile
     * const agentProfile = await prisma.agentProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgentProfileFindFirstArgs>(args?: SelectSubset<T, AgentProfileFindFirstArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first AgentProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentProfileFindFirstOrThrowArgs} args - Arguments to find a AgentProfile
     * @example
     * // Get one AgentProfile
     * const agentProfile = await prisma.agentProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgentProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, AgentProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more AgentProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AgentProfiles
     * const agentProfiles = await prisma.agentProfile.findMany()
     * 
     * // Get first 10 AgentProfiles
     * const agentProfiles = await prisma.agentProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentProfileWithIdOnly = await prisma.agentProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgentProfileFindManyArgs>(args?: SelectSubset<T, AgentProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a AgentProfile.
     * @param {AgentProfileCreateArgs} args - Arguments to create a AgentProfile.
     * @example
     * // Create one AgentProfile
     * const AgentProfile = await prisma.agentProfile.create({
     *   data: {
     *     // ... data to create a AgentProfile
     *   }
     * })
     * 
     */
    create<T extends AgentProfileCreateArgs>(args: SelectSubset<T, AgentProfileCreateArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many AgentProfiles.
     * @param {AgentProfileCreateManyArgs} args - Arguments to create many AgentProfiles.
     * @example
     * // Create many AgentProfiles
     * const agentProfile = await prisma.agentProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgentProfileCreateManyArgs>(args?: SelectSubset<T, AgentProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AgentProfiles and returns the data saved in the database.
     * @param {AgentProfileCreateManyAndReturnArgs} args - Arguments to create many AgentProfiles.
     * @example
     * // Create many AgentProfiles
     * const agentProfile = await prisma.agentProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AgentProfiles and only return the `id`
     * const agentProfileWithIdOnly = await prisma.agentProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AgentProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, AgentProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a AgentProfile.
     * @param {AgentProfileDeleteArgs} args - Arguments to delete one AgentProfile.
     * @example
     * // Delete one AgentProfile
     * const AgentProfile = await prisma.agentProfile.delete({
     *   where: {
     *     // ... filter to delete one AgentProfile
     *   }
     * })
     * 
     */
    delete<T extends AgentProfileDeleteArgs>(args: SelectSubset<T, AgentProfileDeleteArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one AgentProfile.
     * @param {AgentProfileUpdateArgs} args - Arguments to update one AgentProfile.
     * @example
     * // Update one AgentProfile
     * const agentProfile = await prisma.agentProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgentProfileUpdateArgs>(args: SelectSubset<T, AgentProfileUpdateArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more AgentProfiles.
     * @param {AgentProfileDeleteManyArgs} args - Arguments to filter AgentProfiles to delete.
     * @example
     * // Delete a few AgentProfiles
     * const { count } = await prisma.agentProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgentProfileDeleteManyArgs>(args?: SelectSubset<T, AgentProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AgentProfiles
     * const agentProfile = await prisma.agentProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgentProfileUpdateManyArgs>(args: SelectSubset<T, AgentProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentProfiles and returns the data updated in the database.
     * @param {AgentProfileUpdateManyAndReturnArgs} args - Arguments to update many AgentProfiles.
     * @example
     * // Update many AgentProfiles
     * const agentProfile = await prisma.agentProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AgentProfiles and only return the `id`
     * const agentProfileWithIdOnly = await prisma.agentProfile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AgentProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, AgentProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one AgentProfile.
     * @param {AgentProfileUpsertArgs} args - Arguments to update or create a AgentProfile.
     * @example
     * // Update or create a AgentProfile
     * const agentProfile = await prisma.agentProfile.upsert({
     *   create: {
     *     // ... data to create a AgentProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AgentProfile we want to update
     *   }
     * })
     */
    upsert<T extends AgentProfileUpsertArgs>(args: SelectSubset<T, AgentProfileUpsertArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of AgentProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentProfileCountArgs} args - Arguments to filter AgentProfiles to count.
     * @example
     * // Count the number of AgentProfiles
     * const count = await prisma.agentProfile.count({
     *   where: {
     *     // ... the filter for the AgentProfiles we want to count
     *   }
     * })
    **/
    count<T extends AgentProfileCountArgs>(
      args?: Subset<T, AgentProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AgentProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentProfileAggregateArgs>(args: Subset<T, AgentProfileAggregateArgs>): Prisma.PrismaPromise<GetAgentProfileAggregateType<T>>

    /**
     * Group by AgentProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentProfileGroupByArgs['orderBy'] }
        : { orderBy?: AgentProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AgentProfile model
   */
  readonly fields: AgentProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AgentProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgentProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agent<T extends AgentProfile$agentArgs<ExtArgs> = {}>(args?: Subset<T, AgentProfile$agentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AgentProfile model
   */ 
  interface AgentProfileFieldRefs {
    readonly id: FieldRef<"AgentProfile", 'String'>
    readonly onchainId: FieldRef<"AgentProfile", 'Int'>
    readonly name: FieldRef<"AgentProfile", 'String'>
    readonly xHandle: FieldRef<"AgentProfile", 'String'>
    readonly bio: FieldRef<"AgentProfile", 'String[]'>
    readonly lore: FieldRef<"AgentProfile", 'String[]'>
    readonly characteristics: FieldRef<"AgentProfile", 'String[]'>
    readonly knowledge: FieldRef<"AgentProfile", 'String[]'>
    readonly traits: FieldRef<"AgentProfile", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * AgentProfile findUnique
   */
  export type AgentProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * Filter, which AgentProfile to fetch.
     */
    where: AgentProfileWhereUniqueInput
  }

  /**
   * AgentProfile findUniqueOrThrow
   */
  export type AgentProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * Filter, which AgentProfile to fetch.
     */
    where: AgentProfileWhereUniqueInput
  }

  /**
   * AgentProfile findFirst
   */
  export type AgentProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * Filter, which AgentProfile to fetch.
     */
    where?: AgentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentProfiles to fetch.
     */
    orderBy?: AgentProfileOrderByWithRelationInput | AgentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentProfiles.
     */
    cursor?: AgentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentProfiles.
     */
    distinct?: AgentProfileScalarFieldEnum | AgentProfileScalarFieldEnum[]
  }

  /**
   * AgentProfile findFirstOrThrow
   */
  export type AgentProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * Filter, which AgentProfile to fetch.
     */
    where?: AgentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentProfiles to fetch.
     */
    orderBy?: AgentProfileOrderByWithRelationInput | AgentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentProfiles.
     */
    cursor?: AgentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentProfiles.
     */
    distinct?: AgentProfileScalarFieldEnum | AgentProfileScalarFieldEnum[]
  }

  /**
   * AgentProfile findMany
   */
  export type AgentProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * Filter, which AgentProfiles to fetch.
     */
    where?: AgentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentProfiles to fetch.
     */
    orderBy?: AgentProfileOrderByWithRelationInput | AgentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AgentProfiles.
     */
    cursor?: AgentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentProfiles.
     */
    skip?: number
    distinct?: AgentProfileScalarFieldEnum | AgentProfileScalarFieldEnum[]
  }

  /**
   * AgentProfile create
   */
  export type AgentProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a AgentProfile.
     */
    data: XOR<AgentProfileCreateInput, AgentProfileUncheckedCreateInput>
  }

  /**
   * AgentProfile createMany
   */
  export type AgentProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AgentProfiles.
     */
    data: AgentProfileCreateManyInput | AgentProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AgentProfile createManyAndReturn
   */
  export type AgentProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * The data used to create many AgentProfiles.
     */
    data: AgentProfileCreateManyInput | AgentProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AgentProfile update
   */
  export type AgentProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a AgentProfile.
     */
    data: XOR<AgentProfileUpdateInput, AgentProfileUncheckedUpdateInput>
    /**
     * Choose, which AgentProfile to update.
     */
    where: AgentProfileWhereUniqueInput
  }

  /**
   * AgentProfile updateMany
   */
  export type AgentProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AgentProfiles.
     */
    data: XOR<AgentProfileUpdateManyMutationInput, AgentProfileUncheckedUpdateManyInput>
    /**
     * Filter which AgentProfiles to update
     */
    where?: AgentProfileWhereInput
  }

  /**
   * AgentProfile updateManyAndReturn
   */
  export type AgentProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * The data used to update AgentProfiles.
     */
    data: XOR<AgentProfileUpdateManyMutationInput, AgentProfileUncheckedUpdateManyInput>
    /**
     * Filter which AgentProfiles to update
     */
    where?: AgentProfileWhereInput
  }

  /**
   * AgentProfile upsert
   */
  export type AgentProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the AgentProfile to update in case it exists.
     */
    where: AgentProfileWhereUniqueInput
    /**
     * In case the AgentProfile found by the `where` argument doesn't exist, create a new AgentProfile with this data.
     */
    create: XOR<AgentProfileCreateInput, AgentProfileUncheckedCreateInput>
    /**
     * In case the AgentProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentProfileUpdateInput, AgentProfileUncheckedUpdateInput>
  }

  /**
   * AgentProfile delete
   */
  export type AgentProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
    /**
     * Filter which AgentProfile to delete.
     */
    where: AgentProfileWhereUniqueInput
  }

  /**
   * AgentProfile deleteMany
   */
  export type AgentProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentProfiles to delete
     */
    where?: AgentProfileWhereInput
  }

  /**
   * AgentProfile.agent
   */
  export type AgentProfile$agentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    where?: AgentWhereInput
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    cursor?: AgentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * AgentProfile without action
   */
  export type AgentProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentProfile
     */
    select?: AgentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentProfile
     */
    omit?: AgentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentProfileInclude<ExtArgs> | null
  }


  /**
   * Model Agent
   */

  export type AggregateAgent = {
    _count: AgentCountAggregateOutputType | null
    _avg: AgentAvgAggregateOutputType | null
    _sum: AgentSumAggregateOutputType | null
    _min: AgentMinAggregateOutputType | null
    _max: AgentMaxAggregateOutputType | null
  }

  export type AgentAvgAggregateOutputType = {
    agentId: number | null
    health: number | null
  }

  export type AgentSumAggregateOutputType = {
    agentId: number | null
    health: number | null
  }

  export type AgentMinAggregateOutputType = {
    id: string | null
    agentId: number | null
    publicKey: string | null
    agentProfileId: string | null
    health: number | null
    createdAt: Date | null
    updatedAt: Date | null
    gameId: string | null
  }

  export type AgentMaxAggregateOutputType = {
    id: string | null
    agentId: number | null
    publicKey: string | null
    agentProfileId: string | null
    health: number | null
    createdAt: Date | null
    updatedAt: Date | null
    gameId: string | null
  }

  export type AgentCountAggregateOutputType = {
    id: number
    agentId: number
    publicKey: number
    agentProfileId: number
    health: number
    createdAt: number
    updatedAt: number
    gameId: number
    _all: number
  }


  export type AgentAvgAggregateInputType = {
    agentId?: true
    health?: true
  }

  export type AgentSumAggregateInputType = {
    agentId?: true
    health?: true
  }

  export type AgentMinAggregateInputType = {
    id?: true
    agentId?: true
    publicKey?: true
    agentProfileId?: true
    health?: true
    createdAt?: true
    updatedAt?: true
    gameId?: true
  }

  export type AgentMaxAggregateInputType = {
    id?: true
    agentId?: true
    publicKey?: true
    agentProfileId?: true
    health?: true
    createdAt?: true
    updatedAt?: true
    gameId?: true
  }

  export type AgentCountAggregateInputType = {
    id?: true
    agentId?: true
    publicKey?: true
    agentProfileId?: true
    health?: true
    createdAt?: true
    updatedAt?: true
    gameId?: true
    _all?: true
  }

  export type AgentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agent to aggregate.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Agents
    **/
    _count?: true | AgentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AgentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AgentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentMaxAggregateInputType
  }

  export type GetAgentAggregateType<T extends AgentAggregateArgs> = {
        [P in keyof T & keyof AggregateAgent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgent[P]>
      : GetScalarType<T[P], AggregateAgent[P]>
  }




  export type AgentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentWhereInput
    orderBy?: AgentOrderByWithAggregationInput | AgentOrderByWithAggregationInput[]
    by: AgentScalarFieldEnum[] | AgentScalarFieldEnum
    having?: AgentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentCountAggregateInputType | true
    _avg?: AgentAvgAggregateInputType
    _sum?: AgentSumAggregateInputType
    _min?: AgentMinAggregateInputType
    _max?: AgentMaxAggregateInputType
  }

  export type AgentGroupByOutputType = {
    id: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health: number
    createdAt: Date
    updatedAt: Date
    gameId: string
    _count: AgentCountAggregateOutputType | null
    _avg: AgentAvgAggregateOutputType | null
    _sum: AgentSumAggregateOutputType | null
    _min: AgentMinAggregateOutputType | null
    _max: AgentMaxAggregateOutputType | null
  }

  type GetAgentGroupByPayload<T extends AgentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentGroupByOutputType[P]>
            : GetScalarType<T[P], AgentGroupByOutputType[P]>
        }
      >
    >


  export type AgentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    publicKey?: boolean
    agentProfileId?: boolean
    health?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    gameId?: boolean
    agentProfile?: boolean | AgentProfileDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
    location?: boolean | Agent$locationArgs<ExtArgs>
    currentAlliance?: boolean | Agent$currentAllianceArgs<ExtArgs>
    battles?: boolean | Agent$battlesArgs<ExtArgs>
    state?: boolean | Agent$stateArgs<ExtArgs>
    strategy?: boolean | Agent$strategyArgs<ExtArgs>
    cooldowns?: boolean | Agent$cooldownsArgs<ExtArgs>
    alliedBy?: boolean | Agent$alliedByArgs<ExtArgs>
    battlesAsOpponent?: boolean | Agent$battlesAsOpponentArgs<ExtArgs>
    Tweet?: boolean | Agent$TweetArgs<ExtArgs>
    _count?: boolean | AgentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agent"]>

  export type AgentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    publicKey?: boolean
    agentProfileId?: boolean
    health?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    gameId?: boolean
    agentProfile?: boolean | AgentProfileDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agent"]>

  export type AgentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    publicKey?: boolean
    agentProfileId?: boolean
    health?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    gameId?: boolean
    agentProfile?: boolean | AgentProfileDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agent"]>

  export type AgentSelectScalar = {
    id?: boolean
    agentId?: boolean
    publicKey?: boolean
    agentProfileId?: boolean
    health?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    gameId?: boolean
  }

  export type AgentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "agentId" | "publicKey" | "agentProfileId" | "health" | "createdAt" | "updatedAt" | "gameId", ExtArgs["result"]["agent"]>
  export type AgentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agentProfile?: boolean | AgentProfileDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
    location?: boolean | Agent$locationArgs<ExtArgs>
    currentAlliance?: boolean | Agent$currentAllianceArgs<ExtArgs>
    battles?: boolean | Agent$battlesArgs<ExtArgs>
    state?: boolean | Agent$stateArgs<ExtArgs>
    strategy?: boolean | Agent$strategyArgs<ExtArgs>
    cooldowns?: boolean | Agent$cooldownsArgs<ExtArgs>
    alliedBy?: boolean | Agent$alliedByArgs<ExtArgs>
    battlesAsOpponent?: boolean | Agent$battlesAsOpponentArgs<ExtArgs>
    Tweet?: boolean | Agent$TweetArgs<ExtArgs>
    _count?: boolean | AgentCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AgentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agentProfile?: boolean | AgentProfileDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }
  export type AgentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agentProfile?: boolean | AgentProfileDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }

  export type $AgentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Agent"
    objects: {
      agentProfile: Prisma.$AgentProfilePayload<ExtArgs>
      game: Prisma.$GamePayload<ExtArgs>
      location: Prisma.$LocationPayload<ExtArgs> | null
      currentAlliance: Prisma.$AlliancePayload<ExtArgs> | null
      battles: Prisma.$BattlePayload<ExtArgs>[]
      state: Prisma.$AgentStatePayload<ExtArgs> | null
      strategy: Prisma.$StrategyPayload<ExtArgs> | null
      cooldowns: Prisma.$CooldownPayload<ExtArgs>[]
      alliedBy: Prisma.$AlliancePayload<ExtArgs>[]
      battlesAsOpponent: Prisma.$BattlePayload<ExtArgs>[]
      Tweet: Prisma.$TweetPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      agentId: number
      publicKey: string
      agentProfileId: string
      health: number
      createdAt: Date
      updatedAt: Date
      gameId: string
    }, ExtArgs["result"]["agent"]>
    composites: {}
  }

  type AgentGetPayload<S extends boolean | null | undefined | AgentDefaultArgs> = $Result.GetResult<Prisma.$AgentPayload, S>

  type AgentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AgentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AgentCountAggregateInputType | true
    }

  export interface AgentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Agent'], meta: { name: 'Agent' } }
    /**
     * Find zero or one Agent that matches the filter.
     * @param {AgentFindUniqueArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgentFindUniqueArgs>(args: SelectSubset<T, AgentFindUniqueArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Agent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AgentFindUniqueOrThrowArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgentFindUniqueOrThrowArgs>(args: SelectSubset<T, AgentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Agent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindFirstArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgentFindFirstArgs>(args?: SelectSubset<T, AgentFindFirstArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Agent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindFirstOrThrowArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgentFindFirstOrThrowArgs>(args?: SelectSubset<T, AgentFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Agents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Agents
     * const agents = await prisma.agent.findMany()
     * 
     * // Get first 10 Agents
     * const agents = await prisma.agent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentWithIdOnly = await prisma.agent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgentFindManyArgs>(args?: SelectSubset<T, AgentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Agent.
     * @param {AgentCreateArgs} args - Arguments to create a Agent.
     * @example
     * // Create one Agent
     * const Agent = await prisma.agent.create({
     *   data: {
     *     // ... data to create a Agent
     *   }
     * })
     * 
     */
    create<T extends AgentCreateArgs>(args: SelectSubset<T, AgentCreateArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Agents.
     * @param {AgentCreateManyArgs} args - Arguments to create many Agents.
     * @example
     * // Create many Agents
     * const agent = await prisma.agent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgentCreateManyArgs>(args?: SelectSubset<T, AgentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Agents and returns the data saved in the database.
     * @param {AgentCreateManyAndReturnArgs} args - Arguments to create many Agents.
     * @example
     * // Create many Agents
     * const agent = await prisma.agent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Agents and only return the `id`
     * const agentWithIdOnly = await prisma.agent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AgentCreateManyAndReturnArgs>(args?: SelectSubset<T, AgentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Agent.
     * @param {AgentDeleteArgs} args - Arguments to delete one Agent.
     * @example
     * // Delete one Agent
     * const Agent = await prisma.agent.delete({
     *   where: {
     *     // ... filter to delete one Agent
     *   }
     * })
     * 
     */
    delete<T extends AgentDeleteArgs>(args: SelectSubset<T, AgentDeleteArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Agent.
     * @param {AgentUpdateArgs} args - Arguments to update one Agent.
     * @example
     * // Update one Agent
     * const agent = await prisma.agent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgentUpdateArgs>(args: SelectSubset<T, AgentUpdateArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Agents.
     * @param {AgentDeleteManyArgs} args - Arguments to filter Agents to delete.
     * @example
     * // Delete a few Agents
     * const { count } = await prisma.agent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgentDeleteManyArgs>(args?: SelectSubset<T, AgentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Agents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Agents
     * const agent = await prisma.agent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgentUpdateManyArgs>(args: SelectSubset<T, AgentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Agents and returns the data updated in the database.
     * @param {AgentUpdateManyAndReturnArgs} args - Arguments to update many Agents.
     * @example
     * // Update many Agents
     * const agent = await prisma.agent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Agents and only return the `id`
     * const agentWithIdOnly = await prisma.agent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AgentUpdateManyAndReturnArgs>(args: SelectSubset<T, AgentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Agent.
     * @param {AgentUpsertArgs} args - Arguments to update or create a Agent.
     * @example
     * // Update or create a Agent
     * const agent = await prisma.agent.upsert({
     *   create: {
     *     // ... data to create a Agent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Agent we want to update
     *   }
     * })
     */
    upsert<T extends AgentUpsertArgs>(args: SelectSubset<T, AgentUpsertArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Agents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentCountArgs} args - Arguments to filter Agents to count.
     * @example
     * // Count the number of Agents
     * const count = await prisma.agent.count({
     *   where: {
     *     // ... the filter for the Agents we want to count
     *   }
     * })
    **/
    count<T extends AgentCountArgs>(
      args?: Subset<T, AgentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Agent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentAggregateArgs>(args: Subset<T, AgentAggregateArgs>): Prisma.PrismaPromise<GetAgentAggregateType<T>>

    /**
     * Group by Agent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentGroupByArgs['orderBy'] }
        : { orderBy?: AgentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Agent model
   */
  readonly fields: AgentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Agent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agentProfile<T extends AgentProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentProfileDefaultArgs<ExtArgs>>): Prisma__AgentProfileClient<$Result.GetResult<Prisma.$AgentProfilePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    game<T extends GameDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GameDefaultArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    location<T extends Agent$locationArgs<ExtArgs> = {}>(args?: Subset<T, Agent$locationArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    currentAlliance<T extends Agent$currentAllianceArgs<ExtArgs> = {}>(args?: Subset<T, Agent$currentAllianceArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    battles<T extends Agent$battlesArgs<ExtArgs> = {}>(args?: Subset<T, Agent$battlesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    state<T extends Agent$stateArgs<ExtArgs> = {}>(args?: Subset<T, Agent$stateArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    strategy<T extends Agent$strategyArgs<ExtArgs> = {}>(args?: Subset<T, Agent$strategyArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    cooldowns<T extends Agent$cooldownsArgs<ExtArgs> = {}>(args?: Subset<T, Agent$cooldownsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    alliedBy<T extends Agent$alliedByArgs<ExtArgs> = {}>(args?: Subset<T, Agent$alliedByArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    battlesAsOpponent<T extends Agent$battlesAsOpponentArgs<ExtArgs> = {}>(args?: Subset<T, Agent$battlesAsOpponentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    Tweet<T extends Agent$TweetArgs<ExtArgs> = {}>(args?: Subset<T, Agent$TweetArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Agent model
   */ 
  interface AgentFieldRefs {
    readonly id: FieldRef<"Agent", 'String'>
    readonly agentId: FieldRef<"Agent", 'Int'>
    readonly publicKey: FieldRef<"Agent", 'String'>
    readonly agentProfileId: FieldRef<"Agent", 'String'>
    readonly health: FieldRef<"Agent", 'Int'>
    readonly createdAt: FieldRef<"Agent", 'DateTime'>
    readonly updatedAt: FieldRef<"Agent", 'DateTime'>
    readonly gameId: FieldRef<"Agent", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Agent findUnique
   */
  export type AgentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent findUniqueOrThrow
   */
  export type AgentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent findFirst
   */
  export type AgentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agents.
     */
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * Agent findFirstOrThrow
   */
  export type AgentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agents.
     */
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * Agent findMany
   */
  export type AgentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agents to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * Agent create
   */
  export type AgentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * The data needed to create a Agent.
     */
    data: XOR<AgentCreateInput, AgentUncheckedCreateInput>
  }

  /**
   * Agent createMany
   */
  export type AgentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Agents.
     */
    data: AgentCreateManyInput | AgentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Agent createManyAndReturn
   */
  export type AgentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * The data used to create many Agents.
     */
    data: AgentCreateManyInput | AgentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Agent update
   */
  export type AgentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * The data needed to update a Agent.
     */
    data: XOR<AgentUpdateInput, AgentUncheckedUpdateInput>
    /**
     * Choose, which Agent to update.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent updateMany
   */
  export type AgentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Agents.
     */
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyInput>
    /**
     * Filter which Agents to update
     */
    where?: AgentWhereInput
  }

  /**
   * Agent updateManyAndReturn
   */
  export type AgentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * The data used to update Agents.
     */
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyInput>
    /**
     * Filter which Agents to update
     */
    where?: AgentWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Agent upsert
   */
  export type AgentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * The filter to search for the Agent to update in case it exists.
     */
    where: AgentWhereUniqueInput
    /**
     * In case the Agent found by the `where` argument doesn't exist, create a new Agent with this data.
     */
    create: XOR<AgentCreateInput, AgentUncheckedCreateInput>
    /**
     * In case the Agent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentUpdateInput, AgentUncheckedUpdateInput>
  }

  /**
   * Agent delete
   */
  export type AgentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter which Agent to delete.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent deleteMany
   */
  export type AgentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agents to delete
     */
    where?: AgentWhereInput
  }

  /**
   * Agent.location
   */
  export type Agent$locationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
  }

  /**
   * Agent.currentAlliance
   */
  export type Agent$currentAllianceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    where?: AllianceWhereInput
  }

  /**
   * Agent.battles
   */
  export type Agent$battlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    where?: BattleWhereInput
    orderBy?: BattleOrderByWithRelationInput | BattleOrderByWithRelationInput[]
    cursor?: BattleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BattleScalarFieldEnum | BattleScalarFieldEnum[]
  }

  /**
   * Agent.state
   */
  export type Agent$stateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    where?: AgentStateWhereInput
  }

  /**
   * Agent.strategy
   */
  export type Agent$strategyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    where?: StrategyWhereInput
  }

  /**
   * Agent.cooldowns
   */
  export type Agent$cooldownsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    where?: CooldownWhereInput
    orderBy?: CooldownOrderByWithRelationInput | CooldownOrderByWithRelationInput[]
    cursor?: CooldownWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CooldownScalarFieldEnum | CooldownScalarFieldEnum[]
  }

  /**
   * Agent.alliedBy
   */
  export type Agent$alliedByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    where?: AllianceWhereInput
    orderBy?: AllianceOrderByWithRelationInput | AllianceOrderByWithRelationInput[]
    cursor?: AllianceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AllianceScalarFieldEnum | AllianceScalarFieldEnum[]
  }

  /**
   * Agent.battlesAsOpponent
   */
  export type Agent$battlesAsOpponentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    where?: BattleWhereInput
    orderBy?: BattleOrderByWithRelationInput | BattleOrderByWithRelationInput[]
    cursor?: BattleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BattleScalarFieldEnum | BattleScalarFieldEnum[]
  }

  /**
   * Agent.Tweet
   */
  export type Agent$TweetArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    where?: TweetWhereInput
    orderBy?: TweetOrderByWithRelationInput | TweetOrderByWithRelationInput[]
    cursor?: TweetWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TweetScalarFieldEnum | TweetScalarFieldEnum[]
  }

  /**
   * Agent without action
   */
  export type AgentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentInclude<ExtArgs> | null
  }


  /**
   * Model Tweet
   */

  export type AggregateTweet = {
    _count: TweetCountAggregateOutputType | null
    _min: TweetMinAggregateOutputType | null
    _max: TweetMaxAggregateOutputType | null
  }

  export type TweetMinAggregateOutputType = {
    id: string | null
    agentId: string | null
    content: string | null
    type: string | null
    timestamp: Date | null
    conversationId: string | null
  }

  export type TweetMaxAggregateOutputType = {
    id: string | null
    agentId: string | null
    content: string | null
    type: string | null
    timestamp: Date | null
    conversationId: string | null
  }

  export type TweetCountAggregateOutputType = {
    id: number
    agentId: number
    content: number
    type: number
    timestamp: number
    conversationId: number
    _all: number
  }


  export type TweetMinAggregateInputType = {
    id?: true
    agentId?: true
    content?: true
    type?: true
    timestamp?: true
    conversationId?: true
  }

  export type TweetMaxAggregateInputType = {
    id?: true
    agentId?: true
    content?: true
    type?: true
    timestamp?: true
    conversationId?: true
  }

  export type TweetCountAggregateInputType = {
    id?: true
    agentId?: true
    content?: true
    type?: true
    timestamp?: true
    conversationId?: true
    _all?: true
  }

  export type TweetAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tweet to aggregate.
     */
    where?: TweetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tweets to fetch.
     */
    orderBy?: TweetOrderByWithRelationInput | TweetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TweetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tweets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tweets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tweets
    **/
    _count?: true | TweetCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TweetMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TweetMaxAggregateInputType
  }

  export type GetTweetAggregateType<T extends TweetAggregateArgs> = {
        [P in keyof T & keyof AggregateTweet]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTweet[P]>
      : GetScalarType<T[P], AggregateTweet[P]>
  }




  export type TweetGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TweetWhereInput
    orderBy?: TweetOrderByWithAggregationInput | TweetOrderByWithAggregationInput[]
    by: TweetScalarFieldEnum[] | TweetScalarFieldEnum
    having?: TweetScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TweetCountAggregateInputType | true
    _min?: TweetMinAggregateInputType
    _max?: TweetMaxAggregateInputType
  }

  export type TweetGroupByOutputType = {
    id: string
    agentId: string
    content: string
    type: string
    timestamp: Date
    conversationId: string | null
    _count: TweetCountAggregateOutputType | null
    _min: TweetMinAggregateOutputType | null
    _max: TweetMaxAggregateOutputType | null
  }

  type GetTweetGroupByPayload<T extends TweetGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TweetGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TweetGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TweetGroupByOutputType[P]>
            : GetScalarType<T[P], TweetGroupByOutputType[P]>
        }
      >
    >


  export type TweetSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    content?: boolean
    type?: boolean
    timestamp?: boolean
    conversationId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    interactions?: boolean | Tweet$interactionsArgs<ExtArgs>
    _count?: boolean | TweetCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tweet"]>

  export type TweetSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    content?: boolean
    type?: boolean
    timestamp?: boolean
    conversationId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tweet"]>

  export type TweetSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    content?: boolean
    type?: boolean
    timestamp?: boolean
    conversationId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tweet"]>

  export type TweetSelectScalar = {
    id?: boolean
    agentId?: boolean
    content?: boolean
    type?: boolean
    timestamp?: boolean
    conversationId?: boolean
  }

  export type TweetOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "agentId" | "content" | "type" | "timestamp" | "conversationId", ExtArgs["result"]["tweet"]>
  export type TweetInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    interactions?: boolean | Tweet$interactionsArgs<ExtArgs>
    _count?: boolean | TweetCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TweetIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type TweetIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }

  export type $TweetPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Tweet"
    objects: {
      agent: Prisma.$AgentPayload<ExtArgs>
      interactions: Prisma.$InteractionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      agentId: string
      content: string
      type: string
      timestamp: Date
      conversationId: string | null
    }, ExtArgs["result"]["tweet"]>
    composites: {}
  }

  type TweetGetPayload<S extends boolean | null | undefined | TweetDefaultArgs> = $Result.GetResult<Prisma.$TweetPayload, S>

  type TweetCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TweetFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TweetCountAggregateInputType | true
    }

  export interface TweetDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Tweet'], meta: { name: 'Tweet' } }
    /**
     * Find zero or one Tweet that matches the filter.
     * @param {TweetFindUniqueArgs} args - Arguments to find a Tweet
     * @example
     * // Get one Tweet
     * const tweet = await prisma.tweet.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TweetFindUniqueArgs>(args: SelectSubset<T, TweetFindUniqueArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Tweet that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TweetFindUniqueOrThrowArgs} args - Arguments to find a Tweet
     * @example
     * // Get one Tweet
     * const tweet = await prisma.tweet.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TweetFindUniqueOrThrowArgs>(args: SelectSubset<T, TweetFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Tweet that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TweetFindFirstArgs} args - Arguments to find a Tweet
     * @example
     * // Get one Tweet
     * const tweet = await prisma.tweet.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TweetFindFirstArgs>(args?: SelectSubset<T, TweetFindFirstArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Tweet that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TweetFindFirstOrThrowArgs} args - Arguments to find a Tweet
     * @example
     * // Get one Tweet
     * const tweet = await prisma.tweet.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TweetFindFirstOrThrowArgs>(args?: SelectSubset<T, TweetFindFirstOrThrowArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Tweets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TweetFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tweets
     * const tweets = await prisma.tweet.findMany()
     * 
     * // Get first 10 Tweets
     * const tweets = await prisma.tweet.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tweetWithIdOnly = await prisma.tweet.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TweetFindManyArgs>(args?: SelectSubset<T, TweetFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Tweet.
     * @param {TweetCreateArgs} args - Arguments to create a Tweet.
     * @example
     * // Create one Tweet
     * const Tweet = await prisma.tweet.create({
     *   data: {
     *     // ... data to create a Tweet
     *   }
     * })
     * 
     */
    create<T extends TweetCreateArgs>(args: SelectSubset<T, TweetCreateArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Tweets.
     * @param {TweetCreateManyArgs} args - Arguments to create many Tweets.
     * @example
     * // Create many Tweets
     * const tweet = await prisma.tweet.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TweetCreateManyArgs>(args?: SelectSubset<T, TweetCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tweets and returns the data saved in the database.
     * @param {TweetCreateManyAndReturnArgs} args - Arguments to create many Tweets.
     * @example
     * // Create many Tweets
     * const tweet = await prisma.tweet.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tweets and only return the `id`
     * const tweetWithIdOnly = await prisma.tweet.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TweetCreateManyAndReturnArgs>(args?: SelectSubset<T, TweetCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Tweet.
     * @param {TweetDeleteArgs} args - Arguments to delete one Tweet.
     * @example
     * // Delete one Tweet
     * const Tweet = await prisma.tweet.delete({
     *   where: {
     *     // ... filter to delete one Tweet
     *   }
     * })
     * 
     */
    delete<T extends TweetDeleteArgs>(args: SelectSubset<T, TweetDeleteArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Tweet.
     * @param {TweetUpdateArgs} args - Arguments to update one Tweet.
     * @example
     * // Update one Tweet
     * const tweet = await prisma.tweet.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TweetUpdateArgs>(args: SelectSubset<T, TweetUpdateArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Tweets.
     * @param {TweetDeleteManyArgs} args - Arguments to filter Tweets to delete.
     * @example
     * // Delete a few Tweets
     * const { count } = await prisma.tweet.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TweetDeleteManyArgs>(args?: SelectSubset<T, TweetDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tweets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TweetUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tweets
     * const tweet = await prisma.tweet.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TweetUpdateManyArgs>(args: SelectSubset<T, TweetUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tweets and returns the data updated in the database.
     * @param {TweetUpdateManyAndReturnArgs} args - Arguments to update many Tweets.
     * @example
     * // Update many Tweets
     * const tweet = await prisma.tweet.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tweets and only return the `id`
     * const tweetWithIdOnly = await prisma.tweet.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TweetUpdateManyAndReturnArgs>(args: SelectSubset<T, TweetUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Tweet.
     * @param {TweetUpsertArgs} args - Arguments to update or create a Tweet.
     * @example
     * // Update or create a Tweet
     * const tweet = await prisma.tweet.upsert({
     *   create: {
     *     // ... data to create a Tweet
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tweet we want to update
     *   }
     * })
     */
    upsert<T extends TweetUpsertArgs>(args: SelectSubset<T, TweetUpsertArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Tweets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TweetCountArgs} args - Arguments to filter Tweets to count.
     * @example
     * // Count the number of Tweets
     * const count = await prisma.tweet.count({
     *   where: {
     *     // ... the filter for the Tweets we want to count
     *   }
     * })
    **/
    count<T extends TweetCountArgs>(
      args?: Subset<T, TweetCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TweetCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tweet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TweetAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TweetAggregateArgs>(args: Subset<T, TweetAggregateArgs>): Prisma.PrismaPromise<GetTweetAggregateType<T>>

    /**
     * Group by Tweet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TweetGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TweetGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TweetGroupByArgs['orderBy'] }
        : { orderBy?: TweetGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TweetGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTweetGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Tweet model
   */
  readonly fields: TweetFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Tweet.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TweetClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    interactions<T extends Tweet$interactionsArgs<ExtArgs> = {}>(args?: Subset<T, Tweet$interactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Tweet model
   */ 
  interface TweetFieldRefs {
    readonly id: FieldRef<"Tweet", 'String'>
    readonly agentId: FieldRef<"Tweet", 'String'>
    readonly content: FieldRef<"Tweet", 'String'>
    readonly type: FieldRef<"Tweet", 'String'>
    readonly timestamp: FieldRef<"Tweet", 'DateTime'>
    readonly conversationId: FieldRef<"Tweet", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Tweet findUnique
   */
  export type TweetFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * Filter, which Tweet to fetch.
     */
    where: TweetWhereUniqueInput
  }

  /**
   * Tweet findUniqueOrThrow
   */
  export type TweetFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * Filter, which Tweet to fetch.
     */
    where: TweetWhereUniqueInput
  }

  /**
   * Tweet findFirst
   */
  export type TweetFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * Filter, which Tweet to fetch.
     */
    where?: TweetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tweets to fetch.
     */
    orderBy?: TweetOrderByWithRelationInput | TweetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tweets.
     */
    cursor?: TweetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tweets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tweets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tweets.
     */
    distinct?: TweetScalarFieldEnum | TweetScalarFieldEnum[]
  }

  /**
   * Tweet findFirstOrThrow
   */
  export type TweetFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * Filter, which Tweet to fetch.
     */
    where?: TweetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tweets to fetch.
     */
    orderBy?: TweetOrderByWithRelationInput | TweetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tweets.
     */
    cursor?: TweetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tweets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tweets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tweets.
     */
    distinct?: TweetScalarFieldEnum | TweetScalarFieldEnum[]
  }

  /**
   * Tweet findMany
   */
  export type TweetFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * Filter, which Tweets to fetch.
     */
    where?: TweetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tweets to fetch.
     */
    orderBy?: TweetOrderByWithRelationInput | TweetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tweets.
     */
    cursor?: TweetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tweets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tweets.
     */
    skip?: number
    distinct?: TweetScalarFieldEnum | TweetScalarFieldEnum[]
  }

  /**
   * Tweet create
   */
  export type TweetCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * The data needed to create a Tweet.
     */
    data: XOR<TweetCreateInput, TweetUncheckedCreateInput>
  }

  /**
   * Tweet createMany
   */
  export type TweetCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tweets.
     */
    data: TweetCreateManyInput | TweetCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Tweet createManyAndReturn
   */
  export type TweetCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * The data used to create many Tweets.
     */
    data: TweetCreateManyInput | TweetCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Tweet update
   */
  export type TweetUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * The data needed to update a Tweet.
     */
    data: XOR<TweetUpdateInput, TweetUncheckedUpdateInput>
    /**
     * Choose, which Tweet to update.
     */
    where: TweetWhereUniqueInput
  }

  /**
   * Tweet updateMany
   */
  export type TweetUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tweets.
     */
    data: XOR<TweetUpdateManyMutationInput, TweetUncheckedUpdateManyInput>
    /**
     * Filter which Tweets to update
     */
    where?: TweetWhereInput
  }

  /**
   * Tweet updateManyAndReturn
   */
  export type TweetUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * The data used to update Tweets.
     */
    data: XOR<TweetUpdateManyMutationInput, TweetUncheckedUpdateManyInput>
    /**
     * Filter which Tweets to update
     */
    where?: TweetWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Tweet upsert
   */
  export type TweetUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * The filter to search for the Tweet to update in case it exists.
     */
    where: TweetWhereUniqueInput
    /**
     * In case the Tweet found by the `where` argument doesn't exist, create a new Tweet with this data.
     */
    create: XOR<TweetCreateInput, TweetUncheckedCreateInput>
    /**
     * In case the Tweet was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TweetUpdateInput, TweetUncheckedUpdateInput>
  }

  /**
   * Tweet delete
   */
  export type TweetDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
    /**
     * Filter which Tweet to delete.
     */
    where: TweetWhereUniqueInput
  }

  /**
   * Tweet deleteMany
   */
  export type TweetDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tweets to delete
     */
    where?: TweetWhereInput
  }

  /**
   * Tweet.interactions
   */
  export type Tweet$interactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    where?: InteractionWhereInput
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    cursor?: InteractionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InteractionScalarFieldEnum | InteractionScalarFieldEnum[]
  }

  /**
   * Tweet without action
   */
  export type TweetDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tweet
     */
    select?: TweetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tweet
     */
    omit?: TweetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TweetInclude<ExtArgs> | null
  }


  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  export type LocationAvgAggregateOutputType = {
    x: number | null
    y: number | null
  }

  export type LocationSumAggregateOutputType = {
    x: number | null
    y: number | null
  }

  export type LocationMinAggregateOutputType = {
    id: string | null
    x: number | null
    y: number | null
    terrainType: $Enums.TerrainType | null
    agentId: string | null
  }

  export type LocationMaxAggregateOutputType = {
    id: string | null
    x: number | null
    y: number | null
    terrainType: $Enums.TerrainType | null
    agentId: string | null
  }

  export type LocationCountAggregateOutputType = {
    id: number
    x: number
    y: number
    terrainType: number
    agentId: number
    _all: number
  }


  export type LocationAvgAggregateInputType = {
    x?: true
    y?: true
  }

  export type LocationSumAggregateInputType = {
    x?: true
    y?: true
  }

  export type LocationMinAggregateInputType = {
    id?: true
    x?: true
    y?: true
    terrainType?: true
    agentId?: true
  }

  export type LocationMaxAggregateInputType = {
    id?: true
    x?: true
    y?: true
    terrainType?: true
    agentId?: true
  }

  export type LocationCountAggregateInputType = {
    id?: true
    x?: true
    y?: true
    terrainType?: true
    agentId?: true
    _all?: true
  }

  export type LocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locations
    **/
    _count?: true | LocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LocationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LocationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocationMaxAggregateInputType
  }

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
        [P in keyof T & keyof AggregateLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>
  }




  export type LocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithAggregationInput | LocationOrderByWithAggregationInput[]
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum
    having?: LocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocationCountAggregateInputType | true
    _avg?: LocationAvgAggregateInputType
    _sum?: LocationSumAggregateInputType
    _min?: LocationMinAggregateInputType
    _max?: LocationMaxAggregateInputType
  }

  export type LocationGroupByOutputType = {
    id: string
    x: number
    y: number
    terrainType: $Enums.TerrainType
    agentId: string
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>
        }
      >
    >


  export type LocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    x?: boolean
    y?: boolean
    terrainType?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    x?: boolean
    y?: boolean
    terrainType?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    x?: boolean
    y?: boolean
    terrainType?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectScalar = {
    id?: boolean
    x?: boolean
    y?: boolean
    terrainType?: boolean
    agentId?: boolean
  }

  export type LocationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "x" | "y" | "terrainType" | "agentId", ExtArgs["result"]["location"]>
  export type LocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type LocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type LocationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }

  export type $LocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Location"
    objects: {
      agent: Prisma.$AgentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      x: number
      y: number
      terrainType: $Enums.TerrainType
      agentId: string
    }, ExtArgs["result"]["location"]>
    composites: {}
  }

  type LocationGetPayload<S extends boolean | null | undefined | LocationDefaultArgs> = $Result.GetResult<Prisma.$LocationPayload, S>

  type LocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LocationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LocationCountAggregateInputType | true
    }

  export interface LocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Location'], meta: { name: 'Location' } }
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     * 
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const locationWithIdOnly = await prisma.location.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocationFindManyArgs>(args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     * 
     */
    create<T extends LocationCreateArgs>(args: SelectSubset<T, LocationCreateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocationCreateManyArgs>(args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     * 
     */
    delete<T extends LocationDeleteArgs>(args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocationUpdateArgs>(args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocationDeleteManyArgs>(args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocationUpdateManyArgs>(args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations and returns the data updated in the database.
     * @param {LocationUpdateManyAndReturnArgs} args - Arguments to update many Locations.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LocationUpdateManyAndReturnArgs>(args: SelectSubset<T, LocationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
    **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LocationAggregateArgs>(args: Subset<T, LocationAggregateArgs>): Prisma.PrismaPromise<GetLocationAggregateType<T>>

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs['orderBy'] }
        : { orderBy?: LocationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Location model
   */
  readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Location model
   */ 
  interface LocationFieldRefs {
    readonly id: FieldRef<"Location", 'String'>
    readonly x: FieldRef<"Location", 'Int'>
    readonly y: FieldRef<"Location", 'Int'>
    readonly terrainType: FieldRef<"Location", 'TerrainType'>
    readonly agentId: FieldRef<"Location", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location create
   */
  export type LocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>
  }

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Location update
   */
  export type LocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
  }

  /**
   * Location updateManyAndReturn
   */
  export type LocationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
  }

  /**
   * Location delete
   */
  export type LocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput
  }

  /**
   * Location without action
   */
  export type LocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
  }


  /**
   * Model Alliance
   */

  export type AggregateAlliance = {
    _count: AllianceCountAggregateOutputType | null
    _avg: AllianceAvgAggregateOutputType | null
    _sum: AllianceSumAggregateOutputType | null
    _min: AllianceMinAggregateOutputType | null
    _max: AllianceMaxAggregateOutputType | null
  }

  export type AllianceAvgAggregateOutputType = {
    combinedTokens: number | null
  }

  export type AllianceSumAggregateOutputType = {
    combinedTokens: number | null
  }

  export type AllianceMinAggregateOutputType = {
    id: string | null
    formedAt: Date | null
    combinedTokens: number | null
    status: $Enums.AllianceStatus | null
    gameId: string | null
    agentId: string | null
    alliedAgentId: string | null
  }

  export type AllianceMaxAggregateOutputType = {
    id: string | null
    formedAt: Date | null
    combinedTokens: number | null
    status: $Enums.AllianceStatus | null
    gameId: string | null
    agentId: string | null
    alliedAgentId: string | null
  }

  export type AllianceCountAggregateOutputType = {
    id: number
    formedAt: number
    combinedTokens: number
    status: number
    gameId: number
    agentId: number
    alliedAgentId: number
    _all: number
  }


  export type AllianceAvgAggregateInputType = {
    combinedTokens?: true
  }

  export type AllianceSumAggregateInputType = {
    combinedTokens?: true
  }

  export type AllianceMinAggregateInputType = {
    id?: true
    formedAt?: true
    combinedTokens?: true
    status?: true
    gameId?: true
    agentId?: true
    alliedAgentId?: true
  }

  export type AllianceMaxAggregateInputType = {
    id?: true
    formedAt?: true
    combinedTokens?: true
    status?: true
    gameId?: true
    agentId?: true
    alliedAgentId?: true
  }

  export type AllianceCountAggregateInputType = {
    id?: true
    formedAt?: true
    combinedTokens?: true
    status?: true
    gameId?: true
    agentId?: true
    alliedAgentId?: true
    _all?: true
  }

  export type AllianceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Alliance to aggregate.
     */
    where?: AllianceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Alliances to fetch.
     */
    orderBy?: AllianceOrderByWithRelationInput | AllianceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AllianceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Alliances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Alliances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Alliances
    **/
    _count?: true | AllianceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AllianceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AllianceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AllianceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AllianceMaxAggregateInputType
  }

  export type GetAllianceAggregateType<T extends AllianceAggregateArgs> = {
        [P in keyof T & keyof AggregateAlliance]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAlliance[P]>
      : GetScalarType<T[P], AggregateAlliance[P]>
  }




  export type AllianceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AllianceWhereInput
    orderBy?: AllianceOrderByWithAggregationInput | AllianceOrderByWithAggregationInput[]
    by: AllianceScalarFieldEnum[] | AllianceScalarFieldEnum
    having?: AllianceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AllianceCountAggregateInputType | true
    _avg?: AllianceAvgAggregateInputType
    _sum?: AllianceSumAggregateInputType
    _min?: AllianceMinAggregateInputType
    _max?: AllianceMaxAggregateInputType
  }

  export type AllianceGroupByOutputType = {
    id: string
    formedAt: Date
    combinedTokens: number
    status: $Enums.AllianceStatus
    gameId: string
    agentId: string
    alliedAgentId: string
    _count: AllianceCountAggregateOutputType | null
    _avg: AllianceAvgAggregateOutputType | null
    _sum: AllianceSumAggregateOutputType | null
    _min: AllianceMinAggregateOutputType | null
    _max: AllianceMaxAggregateOutputType | null
  }

  type GetAllianceGroupByPayload<T extends AllianceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AllianceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AllianceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AllianceGroupByOutputType[P]>
            : GetScalarType<T[P], AllianceGroupByOutputType[P]>
        }
      >
    >


  export type AllianceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    formedAt?: boolean
    combinedTokens?: boolean
    status?: boolean
    gameId?: boolean
    agentId?: boolean
    alliedAgentId?: boolean
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    alliedAgent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["alliance"]>

  export type AllianceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    formedAt?: boolean
    combinedTokens?: boolean
    status?: boolean
    gameId?: boolean
    agentId?: boolean
    alliedAgentId?: boolean
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    alliedAgent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["alliance"]>

  export type AllianceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    formedAt?: boolean
    combinedTokens?: boolean
    status?: boolean
    gameId?: boolean
    agentId?: boolean
    alliedAgentId?: boolean
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    alliedAgent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["alliance"]>

  export type AllianceSelectScalar = {
    id?: boolean
    formedAt?: boolean
    combinedTokens?: boolean
    status?: boolean
    gameId?: boolean
    agentId?: boolean
    alliedAgentId?: boolean
  }

  export type AllianceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "formedAt" | "combinedTokens" | "status" | "gameId" | "agentId" | "alliedAgentId", ExtArgs["result"]["alliance"]>
  export type AllianceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    alliedAgent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type AllianceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    alliedAgent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type AllianceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    alliedAgent?: boolean | AgentDefaultArgs<ExtArgs>
  }

  export type $AlliancePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Alliance"
    objects: {
      game: Prisma.$GamePayload<ExtArgs>
      agent: Prisma.$AgentPayload<ExtArgs>
      alliedAgent: Prisma.$AgentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      formedAt: Date
      combinedTokens: number
      status: $Enums.AllianceStatus
      gameId: string
      agentId: string
      alliedAgentId: string
    }, ExtArgs["result"]["alliance"]>
    composites: {}
  }

  type AllianceGetPayload<S extends boolean | null | undefined | AllianceDefaultArgs> = $Result.GetResult<Prisma.$AlliancePayload, S>

  type AllianceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AllianceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AllianceCountAggregateInputType | true
    }

  export interface AllianceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Alliance'], meta: { name: 'Alliance' } }
    /**
     * Find zero or one Alliance that matches the filter.
     * @param {AllianceFindUniqueArgs} args - Arguments to find a Alliance
     * @example
     * // Get one Alliance
     * const alliance = await prisma.alliance.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AllianceFindUniqueArgs>(args: SelectSubset<T, AllianceFindUniqueArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Alliance that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AllianceFindUniqueOrThrowArgs} args - Arguments to find a Alliance
     * @example
     * // Get one Alliance
     * const alliance = await prisma.alliance.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AllianceFindUniqueOrThrowArgs>(args: SelectSubset<T, AllianceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Alliance that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AllianceFindFirstArgs} args - Arguments to find a Alliance
     * @example
     * // Get one Alliance
     * const alliance = await prisma.alliance.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AllianceFindFirstArgs>(args?: SelectSubset<T, AllianceFindFirstArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Alliance that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AllianceFindFirstOrThrowArgs} args - Arguments to find a Alliance
     * @example
     * // Get one Alliance
     * const alliance = await prisma.alliance.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AllianceFindFirstOrThrowArgs>(args?: SelectSubset<T, AllianceFindFirstOrThrowArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Alliances that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AllianceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Alliances
     * const alliances = await prisma.alliance.findMany()
     * 
     * // Get first 10 Alliances
     * const alliances = await prisma.alliance.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const allianceWithIdOnly = await prisma.alliance.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AllianceFindManyArgs>(args?: SelectSubset<T, AllianceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Alliance.
     * @param {AllianceCreateArgs} args - Arguments to create a Alliance.
     * @example
     * // Create one Alliance
     * const Alliance = await prisma.alliance.create({
     *   data: {
     *     // ... data to create a Alliance
     *   }
     * })
     * 
     */
    create<T extends AllianceCreateArgs>(args: SelectSubset<T, AllianceCreateArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Alliances.
     * @param {AllianceCreateManyArgs} args - Arguments to create many Alliances.
     * @example
     * // Create many Alliances
     * const alliance = await prisma.alliance.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AllianceCreateManyArgs>(args?: SelectSubset<T, AllianceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Alliances and returns the data saved in the database.
     * @param {AllianceCreateManyAndReturnArgs} args - Arguments to create many Alliances.
     * @example
     * // Create many Alliances
     * const alliance = await prisma.alliance.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Alliances and only return the `id`
     * const allianceWithIdOnly = await prisma.alliance.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AllianceCreateManyAndReturnArgs>(args?: SelectSubset<T, AllianceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Alliance.
     * @param {AllianceDeleteArgs} args - Arguments to delete one Alliance.
     * @example
     * // Delete one Alliance
     * const Alliance = await prisma.alliance.delete({
     *   where: {
     *     // ... filter to delete one Alliance
     *   }
     * })
     * 
     */
    delete<T extends AllianceDeleteArgs>(args: SelectSubset<T, AllianceDeleteArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Alliance.
     * @param {AllianceUpdateArgs} args - Arguments to update one Alliance.
     * @example
     * // Update one Alliance
     * const alliance = await prisma.alliance.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AllianceUpdateArgs>(args: SelectSubset<T, AllianceUpdateArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Alliances.
     * @param {AllianceDeleteManyArgs} args - Arguments to filter Alliances to delete.
     * @example
     * // Delete a few Alliances
     * const { count } = await prisma.alliance.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AllianceDeleteManyArgs>(args?: SelectSubset<T, AllianceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Alliances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AllianceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Alliances
     * const alliance = await prisma.alliance.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AllianceUpdateManyArgs>(args: SelectSubset<T, AllianceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Alliances and returns the data updated in the database.
     * @param {AllianceUpdateManyAndReturnArgs} args - Arguments to update many Alliances.
     * @example
     * // Update many Alliances
     * const alliance = await prisma.alliance.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Alliances and only return the `id`
     * const allianceWithIdOnly = await prisma.alliance.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AllianceUpdateManyAndReturnArgs>(args: SelectSubset<T, AllianceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Alliance.
     * @param {AllianceUpsertArgs} args - Arguments to update or create a Alliance.
     * @example
     * // Update or create a Alliance
     * const alliance = await prisma.alliance.upsert({
     *   create: {
     *     // ... data to create a Alliance
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Alliance we want to update
     *   }
     * })
     */
    upsert<T extends AllianceUpsertArgs>(args: SelectSubset<T, AllianceUpsertArgs<ExtArgs>>): Prisma__AllianceClient<$Result.GetResult<Prisma.$AlliancePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Alliances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AllianceCountArgs} args - Arguments to filter Alliances to count.
     * @example
     * // Count the number of Alliances
     * const count = await prisma.alliance.count({
     *   where: {
     *     // ... the filter for the Alliances we want to count
     *   }
     * })
    **/
    count<T extends AllianceCountArgs>(
      args?: Subset<T, AllianceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AllianceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Alliance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AllianceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AllianceAggregateArgs>(args: Subset<T, AllianceAggregateArgs>): Prisma.PrismaPromise<GetAllianceAggregateType<T>>

    /**
     * Group by Alliance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AllianceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AllianceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AllianceGroupByArgs['orderBy'] }
        : { orderBy?: AllianceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AllianceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAllianceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Alliance model
   */
  readonly fields: AllianceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Alliance.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AllianceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    game<T extends GameDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GameDefaultArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    agent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    alliedAgent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Alliance model
   */ 
  interface AllianceFieldRefs {
    readonly id: FieldRef<"Alliance", 'String'>
    readonly formedAt: FieldRef<"Alliance", 'DateTime'>
    readonly combinedTokens: FieldRef<"Alliance", 'Float'>
    readonly status: FieldRef<"Alliance", 'AllianceStatus'>
    readonly gameId: FieldRef<"Alliance", 'String'>
    readonly agentId: FieldRef<"Alliance", 'String'>
    readonly alliedAgentId: FieldRef<"Alliance", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Alliance findUnique
   */
  export type AllianceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * Filter, which Alliance to fetch.
     */
    where: AllianceWhereUniqueInput
  }

  /**
   * Alliance findUniqueOrThrow
   */
  export type AllianceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * Filter, which Alliance to fetch.
     */
    where: AllianceWhereUniqueInput
  }

  /**
   * Alliance findFirst
   */
  export type AllianceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * Filter, which Alliance to fetch.
     */
    where?: AllianceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Alliances to fetch.
     */
    orderBy?: AllianceOrderByWithRelationInput | AllianceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Alliances.
     */
    cursor?: AllianceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Alliances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Alliances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Alliances.
     */
    distinct?: AllianceScalarFieldEnum | AllianceScalarFieldEnum[]
  }

  /**
   * Alliance findFirstOrThrow
   */
  export type AllianceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * Filter, which Alliance to fetch.
     */
    where?: AllianceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Alliances to fetch.
     */
    orderBy?: AllianceOrderByWithRelationInput | AllianceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Alliances.
     */
    cursor?: AllianceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Alliances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Alliances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Alliances.
     */
    distinct?: AllianceScalarFieldEnum | AllianceScalarFieldEnum[]
  }

  /**
   * Alliance findMany
   */
  export type AllianceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * Filter, which Alliances to fetch.
     */
    where?: AllianceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Alliances to fetch.
     */
    orderBy?: AllianceOrderByWithRelationInput | AllianceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Alliances.
     */
    cursor?: AllianceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Alliances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Alliances.
     */
    skip?: number
    distinct?: AllianceScalarFieldEnum | AllianceScalarFieldEnum[]
  }

  /**
   * Alliance create
   */
  export type AllianceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * The data needed to create a Alliance.
     */
    data: XOR<AllianceCreateInput, AllianceUncheckedCreateInput>
  }

  /**
   * Alliance createMany
   */
  export type AllianceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Alliances.
     */
    data: AllianceCreateManyInput | AllianceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Alliance createManyAndReturn
   */
  export type AllianceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * The data used to create many Alliances.
     */
    data: AllianceCreateManyInput | AllianceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Alliance update
   */
  export type AllianceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * The data needed to update a Alliance.
     */
    data: XOR<AllianceUpdateInput, AllianceUncheckedUpdateInput>
    /**
     * Choose, which Alliance to update.
     */
    where: AllianceWhereUniqueInput
  }

  /**
   * Alliance updateMany
   */
  export type AllianceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Alliances.
     */
    data: XOR<AllianceUpdateManyMutationInput, AllianceUncheckedUpdateManyInput>
    /**
     * Filter which Alliances to update
     */
    where?: AllianceWhereInput
  }

  /**
   * Alliance updateManyAndReturn
   */
  export type AllianceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * The data used to update Alliances.
     */
    data: XOR<AllianceUpdateManyMutationInput, AllianceUncheckedUpdateManyInput>
    /**
     * Filter which Alliances to update
     */
    where?: AllianceWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Alliance upsert
   */
  export type AllianceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * The filter to search for the Alliance to update in case it exists.
     */
    where: AllianceWhereUniqueInput
    /**
     * In case the Alliance found by the `where` argument doesn't exist, create a new Alliance with this data.
     */
    create: XOR<AllianceCreateInput, AllianceUncheckedCreateInput>
    /**
     * In case the Alliance was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AllianceUpdateInput, AllianceUncheckedUpdateInput>
  }

  /**
   * Alliance delete
   */
  export type AllianceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
    /**
     * Filter which Alliance to delete.
     */
    where: AllianceWhereUniqueInput
  }

  /**
   * Alliance deleteMany
   */
  export type AllianceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Alliances to delete
     */
    where?: AllianceWhereInput
  }

  /**
   * Alliance without action
   */
  export type AllianceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Alliance
     */
    select?: AllianceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Alliance
     */
    omit?: AllianceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AllianceInclude<ExtArgs> | null
  }


  /**
   * Model Battle
   */

  export type AggregateBattle = {
    _count: BattleCountAggregateOutputType | null
    _avg: BattleAvgAggregateOutputType | null
    _sum: BattleSumAggregateOutputType | null
    _min: BattleMinAggregateOutputType | null
    _max: BattleMaxAggregateOutputType | null
  }

  export type BattleAvgAggregateOutputType = {
    tokensLost: number | null
    tokensGained: number | null
    probability: number | null
  }

  export type BattleSumAggregateOutputType = {
    tokensLost: number | null
    tokensGained: number | null
    probability: number | null
  }

  export type BattleMinAggregateOutputType = {
    id: string | null
    timestamp: Date | null
    outcome: string | null
    tokensLost: number | null
    tokensGained: number | null
    probability: number | null
    gameId: string | null
    agentId: string | null
    opponentId: string | null
    type: $Enums.BattleType | null
    status: $Enums.BattleStatus | null
    startTime: Date | null
    resolutionTime: Date | null
    resolvedAt: Date | null
  }

  export type BattleMaxAggregateOutputType = {
    id: string | null
    timestamp: Date | null
    outcome: string | null
    tokensLost: number | null
    tokensGained: number | null
    probability: number | null
    gameId: string | null
    agentId: string | null
    opponentId: string | null
    type: $Enums.BattleType | null
    status: $Enums.BattleStatus | null
    startTime: Date | null
    resolutionTime: Date | null
    resolvedAt: Date | null
  }

  export type BattleCountAggregateOutputType = {
    id: number
    timestamp: number
    outcome: number
    tokensLost: number
    tokensGained: number
    probability: number
    gameId: number
    agentId: number
    opponentId: number
    type: number
    status: number
    startTime: number
    resolutionTime: number
    resolvedAt: number
    _all: number
  }


  export type BattleAvgAggregateInputType = {
    tokensLost?: true
    tokensGained?: true
    probability?: true
  }

  export type BattleSumAggregateInputType = {
    tokensLost?: true
    tokensGained?: true
    probability?: true
  }

  export type BattleMinAggregateInputType = {
    id?: true
    timestamp?: true
    outcome?: true
    tokensLost?: true
    tokensGained?: true
    probability?: true
    gameId?: true
    agentId?: true
    opponentId?: true
    type?: true
    status?: true
    startTime?: true
    resolutionTime?: true
    resolvedAt?: true
  }

  export type BattleMaxAggregateInputType = {
    id?: true
    timestamp?: true
    outcome?: true
    tokensLost?: true
    tokensGained?: true
    probability?: true
    gameId?: true
    agentId?: true
    opponentId?: true
    type?: true
    status?: true
    startTime?: true
    resolutionTime?: true
    resolvedAt?: true
  }

  export type BattleCountAggregateInputType = {
    id?: true
    timestamp?: true
    outcome?: true
    tokensLost?: true
    tokensGained?: true
    probability?: true
    gameId?: true
    agentId?: true
    opponentId?: true
    type?: true
    status?: true
    startTime?: true
    resolutionTime?: true
    resolvedAt?: true
    _all?: true
  }

  export type BattleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Battle to aggregate.
     */
    where?: BattleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Battles to fetch.
     */
    orderBy?: BattleOrderByWithRelationInput | BattleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BattleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Battles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Battles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Battles
    **/
    _count?: true | BattleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BattleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BattleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BattleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BattleMaxAggregateInputType
  }

  export type GetBattleAggregateType<T extends BattleAggregateArgs> = {
        [P in keyof T & keyof AggregateBattle]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBattle[P]>
      : GetScalarType<T[P], AggregateBattle[P]>
  }




  export type BattleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BattleWhereInput
    orderBy?: BattleOrderByWithAggregationInput | BattleOrderByWithAggregationInput[]
    by: BattleScalarFieldEnum[] | BattleScalarFieldEnum
    having?: BattleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BattleCountAggregateInputType | true
    _avg?: BattleAvgAggregateInputType
    _sum?: BattleSumAggregateInputType
    _min?: BattleMinAggregateInputType
    _max?: BattleMaxAggregateInputType
  }

  export type BattleGroupByOutputType = {
    id: string
    timestamp: Date
    outcome: string
    tokensLost: number | null
    tokensGained: number | null
    probability: number
    gameId: string
    agentId: string
    opponentId: string
    type: $Enums.BattleType
    status: $Enums.BattleStatus
    startTime: Date
    resolutionTime: Date
    resolvedAt: Date | null
    _count: BattleCountAggregateOutputType | null
    _avg: BattleAvgAggregateOutputType | null
    _sum: BattleSumAggregateOutputType | null
    _min: BattleMinAggregateOutputType | null
    _max: BattleMaxAggregateOutputType | null
  }

  type GetBattleGroupByPayload<T extends BattleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BattleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BattleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BattleGroupByOutputType[P]>
            : GetScalarType<T[P], BattleGroupByOutputType[P]>
        }
      >
    >


  export type BattleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    outcome?: boolean
    tokensLost?: boolean
    tokensGained?: boolean
    probability?: boolean
    gameId?: boolean
    agentId?: boolean
    opponentId?: boolean
    type?: boolean
    status?: boolean
    startTime?: boolean
    resolutionTime?: boolean
    resolvedAt?: boolean
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    opponent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["battle"]>

  export type BattleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    outcome?: boolean
    tokensLost?: boolean
    tokensGained?: boolean
    probability?: boolean
    gameId?: boolean
    agentId?: boolean
    opponentId?: boolean
    type?: boolean
    status?: boolean
    startTime?: boolean
    resolutionTime?: boolean
    resolvedAt?: boolean
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    opponent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["battle"]>

  export type BattleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    outcome?: boolean
    tokensLost?: boolean
    tokensGained?: boolean
    probability?: boolean
    gameId?: boolean
    agentId?: boolean
    opponentId?: boolean
    type?: boolean
    status?: boolean
    startTime?: boolean
    resolutionTime?: boolean
    resolvedAt?: boolean
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    opponent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["battle"]>

  export type BattleSelectScalar = {
    id?: boolean
    timestamp?: boolean
    outcome?: boolean
    tokensLost?: boolean
    tokensGained?: boolean
    probability?: boolean
    gameId?: boolean
    agentId?: boolean
    opponentId?: boolean
    type?: boolean
    status?: boolean
    startTime?: boolean
    resolutionTime?: boolean
    resolvedAt?: boolean
  }

  export type BattleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "timestamp" | "outcome" | "tokensLost" | "tokensGained" | "probability" | "gameId" | "agentId" | "opponentId" | "type" | "status" | "startTime" | "resolutionTime" | "resolvedAt", ExtArgs["result"]["battle"]>
  export type BattleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    opponent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type BattleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    opponent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type BattleIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    game?: boolean | GameDefaultArgs<ExtArgs>
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    opponent?: boolean | AgentDefaultArgs<ExtArgs>
  }

  export type $BattlePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Battle"
    objects: {
      game: Prisma.$GamePayload<ExtArgs>
      agent: Prisma.$AgentPayload<ExtArgs>
      opponent: Prisma.$AgentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      timestamp: Date
      outcome: string
      tokensLost: number | null
      tokensGained: number | null
      probability: number
      gameId: string
      agentId: string
      opponentId: string
      type: $Enums.BattleType
      status: $Enums.BattleStatus
      startTime: Date
      resolutionTime: Date
      resolvedAt: Date | null
    }, ExtArgs["result"]["battle"]>
    composites: {}
  }

  type BattleGetPayload<S extends boolean | null | undefined | BattleDefaultArgs> = $Result.GetResult<Prisma.$BattlePayload, S>

  type BattleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BattleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BattleCountAggregateInputType | true
    }

  export interface BattleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Battle'], meta: { name: 'Battle' } }
    /**
     * Find zero or one Battle that matches the filter.
     * @param {BattleFindUniqueArgs} args - Arguments to find a Battle
     * @example
     * // Get one Battle
     * const battle = await prisma.battle.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BattleFindUniqueArgs>(args: SelectSubset<T, BattleFindUniqueArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Battle that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BattleFindUniqueOrThrowArgs} args - Arguments to find a Battle
     * @example
     * // Get one Battle
     * const battle = await prisma.battle.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BattleFindUniqueOrThrowArgs>(args: SelectSubset<T, BattleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Battle that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleFindFirstArgs} args - Arguments to find a Battle
     * @example
     * // Get one Battle
     * const battle = await prisma.battle.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BattleFindFirstArgs>(args?: SelectSubset<T, BattleFindFirstArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Battle that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleFindFirstOrThrowArgs} args - Arguments to find a Battle
     * @example
     * // Get one Battle
     * const battle = await prisma.battle.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BattleFindFirstOrThrowArgs>(args?: SelectSubset<T, BattleFindFirstOrThrowArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Battles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Battles
     * const battles = await prisma.battle.findMany()
     * 
     * // Get first 10 Battles
     * const battles = await prisma.battle.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const battleWithIdOnly = await prisma.battle.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BattleFindManyArgs>(args?: SelectSubset<T, BattleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Battle.
     * @param {BattleCreateArgs} args - Arguments to create a Battle.
     * @example
     * // Create one Battle
     * const Battle = await prisma.battle.create({
     *   data: {
     *     // ... data to create a Battle
     *   }
     * })
     * 
     */
    create<T extends BattleCreateArgs>(args: SelectSubset<T, BattleCreateArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Battles.
     * @param {BattleCreateManyArgs} args - Arguments to create many Battles.
     * @example
     * // Create many Battles
     * const battle = await prisma.battle.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BattleCreateManyArgs>(args?: SelectSubset<T, BattleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Battles and returns the data saved in the database.
     * @param {BattleCreateManyAndReturnArgs} args - Arguments to create many Battles.
     * @example
     * // Create many Battles
     * const battle = await prisma.battle.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Battles and only return the `id`
     * const battleWithIdOnly = await prisma.battle.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BattleCreateManyAndReturnArgs>(args?: SelectSubset<T, BattleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Battle.
     * @param {BattleDeleteArgs} args - Arguments to delete one Battle.
     * @example
     * // Delete one Battle
     * const Battle = await prisma.battle.delete({
     *   where: {
     *     // ... filter to delete one Battle
     *   }
     * })
     * 
     */
    delete<T extends BattleDeleteArgs>(args: SelectSubset<T, BattleDeleteArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Battle.
     * @param {BattleUpdateArgs} args - Arguments to update one Battle.
     * @example
     * // Update one Battle
     * const battle = await prisma.battle.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BattleUpdateArgs>(args: SelectSubset<T, BattleUpdateArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Battles.
     * @param {BattleDeleteManyArgs} args - Arguments to filter Battles to delete.
     * @example
     * // Delete a few Battles
     * const { count } = await prisma.battle.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BattleDeleteManyArgs>(args?: SelectSubset<T, BattleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Battles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Battles
     * const battle = await prisma.battle.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BattleUpdateManyArgs>(args: SelectSubset<T, BattleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Battles and returns the data updated in the database.
     * @param {BattleUpdateManyAndReturnArgs} args - Arguments to update many Battles.
     * @example
     * // Update many Battles
     * const battle = await prisma.battle.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Battles and only return the `id`
     * const battleWithIdOnly = await prisma.battle.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BattleUpdateManyAndReturnArgs>(args: SelectSubset<T, BattleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Battle.
     * @param {BattleUpsertArgs} args - Arguments to update or create a Battle.
     * @example
     * // Update or create a Battle
     * const battle = await prisma.battle.upsert({
     *   create: {
     *     // ... data to create a Battle
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Battle we want to update
     *   }
     * })
     */
    upsert<T extends BattleUpsertArgs>(args: SelectSubset<T, BattleUpsertArgs<ExtArgs>>): Prisma__BattleClient<$Result.GetResult<Prisma.$BattlePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Battles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleCountArgs} args - Arguments to filter Battles to count.
     * @example
     * // Count the number of Battles
     * const count = await prisma.battle.count({
     *   where: {
     *     // ... the filter for the Battles we want to count
     *   }
     * })
    **/
    count<T extends BattleCountArgs>(
      args?: Subset<T, BattleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BattleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Battle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BattleAggregateArgs>(args: Subset<T, BattleAggregateArgs>): Prisma.PrismaPromise<GetBattleAggregateType<T>>

    /**
     * Group by Battle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BattleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BattleGroupByArgs['orderBy'] }
        : { orderBy?: BattleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BattleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBattleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Battle model
   */
  readonly fields: BattleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Battle.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BattleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    game<T extends GameDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GameDefaultArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    agent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    opponent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Battle model
   */ 
  interface BattleFieldRefs {
    readonly id: FieldRef<"Battle", 'String'>
    readonly timestamp: FieldRef<"Battle", 'DateTime'>
    readonly outcome: FieldRef<"Battle", 'String'>
    readonly tokensLost: FieldRef<"Battle", 'Float'>
    readonly tokensGained: FieldRef<"Battle", 'Float'>
    readonly probability: FieldRef<"Battle", 'Float'>
    readonly gameId: FieldRef<"Battle", 'String'>
    readonly agentId: FieldRef<"Battle", 'String'>
    readonly opponentId: FieldRef<"Battle", 'String'>
    readonly type: FieldRef<"Battle", 'BattleType'>
    readonly status: FieldRef<"Battle", 'BattleStatus'>
    readonly startTime: FieldRef<"Battle", 'DateTime'>
    readonly resolutionTime: FieldRef<"Battle", 'DateTime'>
    readonly resolvedAt: FieldRef<"Battle", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Battle findUnique
   */
  export type BattleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * Filter, which Battle to fetch.
     */
    where: BattleWhereUniqueInput
  }

  /**
   * Battle findUniqueOrThrow
   */
  export type BattleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * Filter, which Battle to fetch.
     */
    where: BattleWhereUniqueInput
  }

  /**
   * Battle findFirst
   */
  export type BattleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * Filter, which Battle to fetch.
     */
    where?: BattleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Battles to fetch.
     */
    orderBy?: BattleOrderByWithRelationInput | BattleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Battles.
     */
    cursor?: BattleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Battles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Battles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Battles.
     */
    distinct?: BattleScalarFieldEnum | BattleScalarFieldEnum[]
  }

  /**
   * Battle findFirstOrThrow
   */
  export type BattleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * Filter, which Battle to fetch.
     */
    where?: BattleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Battles to fetch.
     */
    orderBy?: BattleOrderByWithRelationInput | BattleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Battles.
     */
    cursor?: BattleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Battles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Battles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Battles.
     */
    distinct?: BattleScalarFieldEnum | BattleScalarFieldEnum[]
  }

  /**
   * Battle findMany
   */
  export type BattleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * Filter, which Battles to fetch.
     */
    where?: BattleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Battles to fetch.
     */
    orderBy?: BattleOrderByWithRelationInput | BattleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Battles.
     */
    cursor?: BattleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Battles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Battles.
     */
    skip?: number
    distinct?: BattleScalarFieldEnum | BattleScalarFieldEnum[]
  }

  /**
   * Battle create
   */
  export type BattleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * The data needed to create a Battle.
     */
    data: XOR<BattleCreateInput, BattleUncheckedCreateInput>
  }

  /**
   * Battle createMany
   */
  export type BattleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Battles.
     */
    data: BattleCreateManyInput | BattleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Battle createManyAndReturn
   */
  export type BattleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * The data used to create many Battles.
     */
    data: BattleCreateManyInput | BattleCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Battle update
   */
  export type BattleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * The data needed to update a Battle.
     */
    data: XOR<BattleUpdateInput, BattleUncheckedUpdateInput>
    /**
     * Choose, which Battle to update.
     */
    where: BattleWhereUniqueInput
  }

  /**
   * Battle updateMany
   */
  export type BattleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Battles.
     */
    data: XOR<BattleUpdateManyMutationInput, BattleUncheckedUpdateManyInput>
    /**
     * Filter which Battles to update
     */
    where?: BattleWhereInput
  }

  /**
   * Battle updateManyAndReturn
   */
  export type BattleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * The data used to update Battles.
     */
    data: XOR<BattleUpdateManyMutationInput, BattleUncheckedUpdateManyInput>
    /**
     * Filter which Battles to update
     */
    where?: BattleWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Battle upsert
   */
  export type BattleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * The filter to search for the Battle to update in case it exists.
     */
    where: BattleWhereUniqueInput
    /**
     * In case the Battle found by the `where` argument doesn't exist, create a new Battle with this data.
     */
    create: XOR<BattleCreateInput, BattleUncheckedCreateInput>
    /**
     * In case the Battle was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BattleUpdateInput, BattleUncheckedUpdateInput>
  }

  /**
   * Battle delete
   */
  export type BattleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
    /**
     * Filter which Battle to delete.
     */
    where: BattleWhereUniqueInput
  }

  /**
   * Battle deleteMany
   */
  export type BattleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Battles to delete
     */
    where?: BattleWhereInput
  }

  /**
   * Battle without action
   */
  export type BattleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Battle
     */
    select?: BattleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Battle
     */
    omit?: BattleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleInclude<ExtArgs> | null
  }


  /**
   * Model Interaction
   */

  export type AggregateInteraction = {
    _count: InteractionCountAggregateOutputType | null
    _min: InteractionMinAggregateOutputType | null
    _max: InteractionMaxAggregateOutputType | null
  }

  export type InteractionMinAggregateOutputType = {
    id: string | null
    tweetId: string | null
    userId: string | null
    type: string | null
    content: string | null
    timestamp: Date | null
  }

  export type InteractionMaxAggregateOutputType = {
    id: string | null
    tweetId: string | null
    userId: string | null
    type: string | null
    content: string | null
    timestamp: Date | null
  }

  export type InteractionCountAggregateOutputType = {
    id: number
    tweetId: number
    userId: number
    type: number
    content: number
    timestamp: number
    userMetrics: number
    _all: number
  }


  export type InteractionMinAggregateInputType = {
    id?: true
    tweetId?: true
    userId?: true
    type?: true
    content?: true
    timestamp?: true
  }

  export type InteractionMaxAggregateInputType = {
    id?: true
    tweetId?: true
    userId?: true
    type?: true
    content?: true
    timestamp?: true
  }

  export type InteractionCountAggregateInputType = {
    id?: true
    tweetId?: true
    userId?: true
    type?: true
    content?: true
    timestamp?: true
    userMetrics?: true
    _all?: true
  }

  export type InteractionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Interaction to aggregate.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Interactions
    **/
    _count?: true | InteractionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InteractionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InteractionMaxAggregateInputType
  }

  export type GetInteractionAggregateType<T extends InteractionAggregateArgs> = {
        [P in keyof T & keyof AggregateInteraction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInteraction[P]>
      : GetScalarType<T[P], AggregateInteraction[P]>
  }




  export type InteractionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InteractionWhereInput
    orderBy?: InteractionOrderByWithAggregationInput | InteractionOrderByWithAggregationInput[]
    by: InteractionScalarFieldEnum[] | InteractionScalarFieldEnum
    having?: InteractionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InteractionCountAggregateInputType | true
    _min?: InteractionMinAggregateInputType
    _max?: InteractionMaxAggregateInputType
  }

  export type InteractionGroupByOutputType = {
    id: string
    tweetId: string
    userId: string
    type: string
    content: string | null
    timestamp: Date
    userMetrics: JsonValue
    _count: InteractionCountAggregateOutputType | null
    _min: InteractionMinAggregateOutputType | null
    _max: InteractionMaxAggregateOutputType | null
  }

  type GetInteractionGroupByPayload<T extends InteractionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InteractionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InteractionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InteractionGroupByOutputType[P]>
            : GetScalarType<T[P], InteractionGroupByOutputType[P]>
        }
      >
    >


  export type InteractionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tweetId?: boolean
    userId?: boolean
    type?: boolean
    content?: boolean
    timestamp?: boolean
    userMetrics?: boolean
    tweet?: boolean | TweetDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["interaction"]>

  export type InteractionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tweetId?: boolean
    userId?: boolean
    type?: boolean
    content?: boolean
    timestamp?: boolean
    userMetrics?: boolean
    tweet?: boolean | TweetDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["interaction"]>

  export type InteractionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tweetId?: boolean
    userId?: boolean
    type?: boolean
    content?: boolean
    timestamp?: boolean
    userMetrics?: boolean
    tweet?: boolean | TweetDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["interaction"]>

  export type InteractionSelectScalar = {
    id?: boolean
    tweetId?: boolean
    userId?: boolean
    type?: boolean
    content?: boolean
    timestamp?: boolean
    userMetrics?: boolean
  }

  export type InteractionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tweetId" | "userId" | "type" | "content" | "timestamp" | "userMetrics", ExtArgs["result"]["interaction"]>
  export type InteractionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tweet?: boolean | TweetDefaultArgs<ExtArgs>
  }
  export type InteractionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tweet?: boolean | TweetDefaultArgs<ExtArgs>
  }
  export type InteractionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tweet?: boolean | TweetDefaultArgs<ExtArgs>
  }

  export type $InteractionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Interaction"
    objects: {
      tweet: Prisma.$TweetPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tweetId: string
      userId: string
      type: string
      content: string | null
      timestamp: Date
      userMetrics: Prisma.JsonValue
    }, ExtArgs["result"]["interaction"]>
    composites: {}
  }

  type InteractionGetPayload<S extends boolean | null | undefined | InteractionDefaultArgs> = $Result.GetResult<Prisma.$InteractionPayload, S>

  type InteractionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InteractionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InteractionCountAggregateInputType | true
    }

  export interface InteractionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Interaction'], meta: { name: 'Interaction' } }
    /**
     * Find zero or one Interaction that matches the filter.
     * @param {InteractionFindUniqueArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InteractionFindUniqueArgs>(args: SelectSubset<T, InteractionFindUniqueArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Interaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InteractionFindUniqueOrThrowArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InteractionFindUniqueOrThrowArgs>(args: SelectSubset<T, InteractionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Interaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionFindFirstArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InteractionFindFirstArgs>(args?: SelectSubset<T, InteractionFindFirstArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Interaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionFindFirstOrThrowArgs} args - Arguments to find a Interaction
     * @example
     * // Get one Interaction
     * const interaction = await prisma.interaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InteractionFindFirstOrThrowArgs>(args?: SelectSubset<T, InteractionFindFirstOrThrowArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Interactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Interactions
     * const interactions = await prisma.interaction.findMany()
     * 
     * // Get first 10 Interactions
     * const interactions = await prisma.interaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const interactionWithIdOnly = await prisma.interaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InteractionFindManyArgs>(args?: SelectSubset<T, InteractionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Interaction.
     * @param {InteractionCreateArgs} args - Arguments to create a Interaction.
     * @example
     * // Create one Interaction
     * const Interaction = await prisma.interaction.create({
     *   data: {
     *     // ... data to create a Interaction
     *   }
     * })
     * 
     */
    create<T extends InteractionCreateArgs>(args: SelectSubset<T, InteractionCreateArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Interactions.
     * @param {InteractionCreateManyArgs} args - Arguments to create many Interactions.
     * @example
     * // Create many Interactions
     * const interaction = await prisma.interaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InteractionCreateManyArgs>(args?: SelectSubset<T, InteractionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Interactions and returns the data saved in the database.
     * @param {InteractionCreateManyAndReturnArgs} args - Arguments to create many Interactions.
     * @example
     * // Create many Interactions
     * const interaction = await prisma.interaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Interactions and only return the `id`
     * const interactionWithIdOnly = await prisma.interaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InteractionCreateManyAndReturnArgs>(args?: SelectSubset<T, InteractionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Interaction.
     * @param {InteractionDeleteArgs} args - Arguments to delete one Interaction.
     * @example
     * // Delete one Interaction
     * const Interaction = await prisma.interaction.delete({
     *   where: {
     *     // ... filter to delete one Interaction
     *   }
     * })
     * 
     */
    delete<T extends InteractionDeleteArgs>(args: SelectSubset<T, InteractionDeleteArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Interaction.
     * @param {InteractionUpdateArgs} args - Arguments to update one Interaction.
     * @example
     * // Update one Interaction
     * const interaction = await prisma.interaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InteractionUpdateArgs>(args: SelectSubset<T, InteractionUpdateArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Interactions.
     * @param {InteractionDeleteManyArgs} args - Arguments to filter Interactions to delete.
     * @example
     * // Delete a few Interactions
     * const { count } = await prisma.interaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InteractionDeleteManyArgs>(args?: SelectSubset<T, InteractionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Interactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Interactions
     * const interaction = await prisma.interaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InteractionUpdateManyArgs>(args: SelectSubset<T, InteractionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Interactions and returns the data updated in the database.
     * @param {InteractionUpdateManyAndReturnArgs} args - Arguments to update many Interactions.
     * @example
     * // Update many Interactions
     * const interaction = await prisma.interaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Interactions and only return the `id`
     * const interactionWithIdOnly = await prisma.interaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InteractionUpdateManyAndReturnArgs>(args: SelectSubset<T, InteractionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Interaction.
     * @param {InteractionUpsertArgs} args - Arguments to update or create a Interaction.
     * @example
     * // Update or create a Interaction
     * const interaction = await prisma.interaction.upsert({
     *   create: {
     *     // ... data to create a Interaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Interaction we want to update
     *   }
     * })
     */
    upsert<T extends InteractionUpsertArgs>(args: SelectSubset<T, InteractionUpsertArgs<ExtArgs>>): Prisma__InteractionClient<$Result.GetResult<Prisma.$InteractionPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Interactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionCountArgs} args - Arguments to filter Interactions to count.
     * @example
     * // Count the number of Interactions
     * const count = await prisma.interaction.count({
     *   where: {
     *     // ... the filter for the Interactions we want to count
     *   }
     * })
    **/
    count<T extends InteractionCountArgs>(
      args?: Subset<T, InteractionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InteractionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Interaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InteractionAggregateArgs>(args: Subset<T, InteractionAggregateArgs>): Prisma.PrismaPromise<GetInteractionAggregateType<T>>

    /**
     * Group by Interaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InteractionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InteractionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InteractionGroupByArgs['orderBy'] }
        : { orderBy?: InteractionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InteractionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInteractionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Interaction model
   */
  readonly fields: InteractionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Interaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InteractionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tweet<T extends TweetDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TweetDefaultArgs<ExtArgs>>): Prisma__TweetClient<$Result.GetResult<Prisma.$TweetPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Interaction model
   */ 
  interface InteractionFieldRefs {
    readonly id: FieldRef<"Interaction", 'String'>
    readonly tweetId: FieldRef<"Interaction", 'String'>
    readonly userId: FieldRef<"Interaction", 'String'>
    readonly type: FieldRef<"Interaction", 'String'>
    readonly content: FieldRef<"Interaction", 'String'>
    readonly timestamp: FieldRef<"Interaction", 'DateTime'>
    readonly userMetrics: FieldRef<"Interaction", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Interaction findUnique
   */
  export type InteractionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction findUniqueOrThrow
   */
  export type InteractionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction findFirst
   */
  export type InteractionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Interactions.
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Interactions.
     */
    distinct?: InteractionScalarFieldEnum | InteractionScalarFieldEnum[]
  }

  /**
   * Interaction findFirstOrThrow
   */
  export type InteractionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * Filter, which Interaction to fetch.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Interactions.
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Interactions.
     */
    distinct?: InteractionScalarFieldEnum | InteractionScalarFieldEnum[]
  }

  /**
   * Interaction findMany
   */
  export type InteractionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * Filter, which Interactions to fetch.
     */
    where?: InteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Interactions to fetch.
     */
    orderBy?: InteractionOrderByWithRelationInput | InteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Interactions.
     */
    cursor?: InteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Interactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Interactions.
     */
    skip?: number
    distinct?: InteractionScalarFieldEnum | InteractionScalarFieldEnum[]
  }

  /**
   * Interaction create
   */
  export type InteractionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * The data needed to create a Interaction.
     */
    data: XOR<InteractionCreateInput, InteractionUncheckedCreateInput>
  }

  /**
   * Interaction createMany
   */
  export type InteractionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Interactions.
     */
    data: InteractionCreateManyInput | InteractionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Interaction createManyAndReturn
   */
  export type InteractionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * The data used to create many Interactions.
     */
    data: InteractionCreateManyInput | InteractionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Interaction update
   */
  export type InteractionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * The data needed to update a Interaction.
     */
    data: XOR<InteractionUpdateInput, InteractionUncheckedUpdateInput>
    /**
     * Choose, which Interaction to update.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction updateMany
   */
  export type InteractionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Interactions.
     */
    data: XOR<InteractionUpdateManyMutationInput, InteractionUncheckedUpdateManyInput>
    /**
     * Filter which Interactions to update
     */
    where?: InteractionWhereInput
  }

  /**
   * Interaction updateManyAndReturn
   */
  export type InteractionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * The data used to update Interactions.
     */
    data: XOR<InteractionUpdateManyMutationInput, InteractionUncheckedUpdateManyInput>
    /**
     * Filter which Interactions to update
     */
    where?: InteractionWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Interaction upsert
   */
  export type InteractionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * The filter to search for the Interaction to update in case it exists.
     */
    where: InteractionWhereUniqueInput
    /**
     * In case the Interaction found by the `where` argument doesn't exist, create a new Interaction with this data.
     */
    create: XOR<InteractionCreateInput, InteractionUncheckedCreateInput>
    /**
     * In case the Interaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InteractionUpdateInput, InteractionUncheckedUpdateInput>
  }

  /**
   * Interaction delete
   */
  export type InteractionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
    /**
     * Filter which Interaction to delete.
     */
    where: InteractionWhereUniqueInput
  }

  /**
   * Interaction deleteMany
   */
  export type InteractionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Interactions to delete
     */
    where?: InteractionWhereInput
  }

  /**
   * Interaction without action
   */
  export type InteractionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Interaction
     */
    select?: InteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Interaction
     */
    omit?: InteractionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InteractionInclude<ExtArgs> | null
  }


  /**
   * Model AgentState
   */

  export type AggregateAgentState = {
    _count: AgentStateCountAggregateOutputType | null
    _avg: AgentStateAvgAggregateOutputType | null
    _sum: AgentStateSumAggregateOutputType | null
    _min: AgentStateMinAggregateOutputType | null
    _max: AgentStateMaxAggregateOutputType | null
  }

  export type AgentStateAvgAggregateOutputType = {
    influenceScore: number | null
  }

  export type AgentStateSumAggregateOutputType = {
    influenceScore: number | null
  }

  export type AgentStateMinAggregateOutputType = {
    id: string | null
    isAlive: boolean | null
    lastActionType: string | null
    lastActionTime: Date | null
    lastActionDetails: string | null
    influencedByTweet: string | null
    influenceScore: number | null
    agentId: string | null
  }

  export type AgentStateMaxAggregateOutputType = {
    id: string | null
    isAlive: boolean | null
    lastActionType: string | null
    lastActionTime: Date | null
    lastActionDetails: string | null
    influencedByTweet: string | null
    influenceScore: number | null
    agentId: string | null
  }

  export type AgentStateCountAggregateOutputType = {
    id: number
    isAlive: number
    lastActionType: number
    lastActionTime: number
    lastActionDetails: number
    influencedByTweet: number
    influenceScore: number
    agentId: number
    _all: number
  }


  export type AgentStateAvgAggregateInputType = {
    influenceScore?: true
  }

  export type AgentStateSumAggregateInputType = {
    influenceScore?: true
  }

  export type AgentStateMinAggregateInputType = {
    id?: true
    isAlive?: true
    lastActionType?: true
    lastActionTime?: true
    lastActionDetails?: true
    influencedByTweet?: true
    influenceScore?: true
    agentId?: true
  }

  export type AgentStateMaxAggregateInputType = {
    id?: true
    isAlive?: true
    lastActionType?: true
    lastActionTime?: true
    lastActionDetails?: true
    influencedByTweet?: true
    influenceScore?: true
    agentId?: true
  }

  export type AgentStateCountAggregateInputType = {
    id?: true
    isAlive?: true
    lastActionType?: true
    lastActionTime?: true
    lastActionDetails?: true
    influencedByTweet?: true
    influenceScore?: true
    agentId?: true
    _all?: true
  }

  export type AgentStateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentState to aggregate.
     */
    where?: AgentStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentStates to fetch.
     */
    orderBy?: AgentStateOrderByWithRelationInput | AgentStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AgentStates
    **/
    _count?: true | AgentStateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AgentStateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AgentStateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentStateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentStateMaxAggregateInputType
  }

  export type GetAgentStateAggregateType<T extends AgentStateAggregateArgs> = {
        [P in keyof T & keyof AggregateAgentState]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgentState[P]>
      : GetScalarType<T[P], AggregateAgentState[P]>
  }




  export type AgentStateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentStateWhereInput
    orderBy?: AgentStateOrderByWithAggregationInput | AgentStateOrderByWithAggregationInput[]
    by: AgentStateScalarFieldEnum[] | AgentStateScalarFieldEnum
    having?: AgentStateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentStateCountAggregateInputType | true
    _avg?: AgentStateAvgAggregateInputType
    _sum?: AgentStateSumAggregateInputType
    _min?: AgentStateMinAggregateInputType
    _max?: AgentStateMaxAggregateInputType
  }

  export type AgentStateGroupByOutputType = {
    id: string
    isAlive: boolean
    lastActionType: string
    lastActionTime: Date
    lastActionDetails: string
    influencedByTweet: string | null
    influenceScore: number
    agentId: string
    _count: AgentStateCountAggregateOutputType | null
    _avg: AgentStateAvgAggregateOutputType | null
    _sum: AgentStateSumAggregateOutputType | null
    _min: AgentStateMinAggregateOutputType | null
    _max: AgentStateMaxAggregateOutputType | null
  }

  type GetAgentStateGroupByPayload<T extends AgentStateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgentStateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentStateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentStateGroupByOutputType[P]>
            : GetScalarType<T[P], AgentStateGroupByOutputType[P]>
        }
      >
    >


  export type AgentStateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isAlive?: boolean
    lastActionType?: boolean
    lastActionTime?: boolean
    lastActionDetails?: boolean
    influencedByTweet?: boolean
    influenceScore?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentState"]>

  export type AgentStateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isAlive?: boolean
    lastActionType?: boolean
    lastActionTime?: boolean
    lastActionDetails?: boolean
    influencedByTweet?: boolean
    influenceScore?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentState"]>

  export type AgentStateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isAlive?: boolean
    lastActionType?: boolean
    lastActionTime?: boolean
    lastActionDetails?: boolean
    influencedByTweet?: boolean
    influenceScore?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentState"]>

  export type AgentStateSelectScalar = {
    id?: boolean
    isAlive?: boolean
    lastActionType?: boolean
    lastActionTime?: boolean
    lastActionDetails?: boolean
    influencedByTweet?: boolean
    influenceScore?: boolean
    agentId?: boolean
  }

  export type AgentStateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "isAlive" | "lastActionType" | "lastActionTime" | "lastActionDetails" | "influencedByTweet" | "influenceScore" | "agentId", ExtArgs["result"]["agentState"]>
  export type AgentStateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type AgentStateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type AgentStateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }

  export type $AgentStatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AgentState"
    objects: {
      agent: Prisma.$AgentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      isAlive: boolean
      lastActionType: string
      lastActionTime: Date
      lastActionDetails: string
      influencedByTweet: string | null
      influenceScore: number
      agentId: string
    }, ExtArgs["result"]["agentState"]>
    composites: {}
  }

  type AgentStateGetPayload<S extends boolean | null | undefined | AgentStateDefaultArgs> = $Result.GetResult<Prisma.$AgentStatePayload, S>

  type AgentStateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AgentStateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AgentStateCountAggregateInputType | true
    }

  export interface AgentStateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AgentState'], meta: { name: 'AgentState' } }
    /**
     * Find zero or one AgentState that matches the filter.
     * @param {AgentStateFindUniqueArgs} args - Arguments to find a AgentState
     * @example
     * // Get one AgentState
     * const agentState = await prisma.agentState.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgentStateFindUniqueArgs>(args: SelectSubset<T, AgentStateFindUniqueArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one AgentState that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AgentStateFindUniqueOrThrowArgs} args - Arguments to find a AgentState
     * @example
     * // Get one AgentState
     * const agentState = await prisma.agentState.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgentStateFindUniqueOrThrowArgs>(args: SelectSubset<T, AgentStateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first AgentState that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentStateFindFirstArgs} args - Arguments to find a AgentState
     * @example
     * // Get one AgentState
     * const agentState = await prisma.agentState.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgentStateFindFirstArgs>(args?: SelectSubset<T, AgentStateFindFirstArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first AgentState that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentStateFindFirstOrThrowArgs} args - Arguments to find a AgentState
     * @example
     * // Get one AgentState
     * const agentState = await prisma.agentState.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgentStateFindFirstOrThrowArgs>(args?: SelectSubset<T, AgentStateFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more AgentStates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentStateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AgentStates
     * const agentStates = await prisma.agentState.findMany()
     * 
     * // Get first 10 AgentStates
     * const agentStates = await prisma.agentState.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentStateWithIdOnly = await prisma.agentState.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgentStateFindManyArgs>(args?: SelectSubset<T, AgentStateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a AgentState.
     * @param {AgentStateCreateArgs} args - Arguments to create a AgentState.
     * @example
     * // Create one AgentState
     * const AgentState = await prisma.agentState.create({
     *   data: {
     *     // ... data to create a AgentState
     *   }
     * })
     * 
     */
    create<T extends AgentStateCreateArgs>(args: SelectSubset<T, AgentStateCreateArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many AgentStates.
     * @param {AgentStateCreateManyArgs} args - Arguments to create many AgentStates.
     * @example
     * // Create many AgentStates
     * const agentState = await prisma.agentState.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgentStateCreateManyArgs>(args?: SelectSubset<T, AgentStateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AgentStates and returns the data saved in the database.
     * @param {AgentStateCreateManyAndReturnArgs} args - Arguments to create many AgentStates.
     * @example
     * // Create many AgentStates
     * const agentState = await prisma.agentState.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AgentStates and only return the `id`
     * const agentStateWithIdOnly = await prisma.agentState.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AgentStateCreateManyAndReturnArgs>(args?: SelectSubset<T, AgentStateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a AgentState.
     * @param {AgentStateDeleteArgs} args - Arguments to delete one AgentState.
     * @example
     * // Delete one AgentState
     * const AgentState = await prisma.agentState.delete({
     *   where: {
     *     // ... filter to delete one AgentState
     *   }
     * })
     * 
     */
    delete<T extends AgentStateDeleteArgs>(args: SelectSubset<T, AgentStateDeleteArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one AgentState.
     * @param {AgentStateUpdateArgs} args - Arguments to update one AgentState.
     * @example
     * // Update one AgentState
     * const agentState = await prisma.agentState.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgentStateUpdateArgs>(args: SelectSubset<T, AgentStateUpdateArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more AgentStates.
     * @param {AgentStateDeleteManyArgs} args - Arguments to filter AgentStates to delete.
     * @example
     * // Delete a few AgentStates
     * const { count } = await prisma.agentState.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgentStateDeleteManyArgs>(args?: SelectSubset<T, AgentStateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentStateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AgentStates
     * const agentState = await prisma.agentState.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgentStateUpdateManyArgs>(args: SelectSubset<T, AgentStateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentStates and returns the data updated in the database.
     * @param {AgentStateUpdateManyAndReturnArgs} args - Arguments to update many AgentStates.
     * @example
     * // Update many AgentStates
     * const agentState = await prisma.agentState.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AgentStates and only return the `id`
     * const agentStateWithIdOnly = await prisma.agentState.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AgentStateUpdateManyAndReturnArgs>(args: SelectSubset<T, AgentStateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one AgentState.
     * @param {AgentStateUpsertArgs} args - Arguments to update or create a AgentState.
     * @example
     * // Update or create a AgentState
     * const agentState = await prisma.agentState.upsert({
     *   create: {
     *     // ... data to create a AgentState
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AgentState we want to update
     *   }
     * })
     */
    upsert<T extends AgentStateUpsertArgs>(args: SelectSubset<T, AgentStateUpsertArgs<ExtArgs>>): Prisma__AgentStateClient<$Result.GetResult<Prisma.$AgentStatePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of AgentStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentStateCountArgs} args - Arguments to filter AgentStates to count.
     * @example
     * // Count the number of AgentStates
     * const count = await prisma.agentState.count({
     *   where: {
     *     // ... the filter for the AgentStates we want to count
     *   }
     * })
    **/
    count<T extends AgentStateCountArgs>(
      args?: Subset<T, AgentStateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentStateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AgentState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentStateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentStateAggregateArgs>(args: Subset<T, AgentStateAggregateArgs>): Prisma.PrismaPromise<GetAgentStateAggregateType<T>>

    /**
     * Group by AgentState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentStateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentStateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentStateGroupByArgs['orderBy'] }
        : { orderBy?: AgentStateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentStateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentStateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AgentState model
   */
  readonly fields: AgentStateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AgentState.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgentStateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AgentState model
   */ 
  interface AgentStateFieldRefs {
    readonly id: FieldRef<"AgentState", 'String'>
    readonly isAlive: FieldRef<"AgentState", 'Boolean'>
    readonly lastActionType: FieldRef<"AgentState", 'String'>
    readonly lastActionTime: FieldRef<"AgentState", 'DateTime'>
    readonly lastActionDetails: FieldRef<"AgentState", 'String'>
    readonly influencedByTweet: FieldRef<"AgentState", 'String'>
    readonly influenceScore: FieldRef<"AgentState", 'Float'>
    readonly agentId: FieldRef<"AgentState", 'String'>
  }
    

  // Custom InputTypes
  /**
   * AgentState findUnique
   */
  export type AgentStateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * Filter, which AgentState to fetch.
     */
    where: AgentStateWhereUniqueInput
  }

  /**
   * AgentState findUniqueOrThrow
   */
  export type AgentStateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * Filter, which AgentState to fetch.
     */
    where: AgentStateWhereUniqueInput
  }

  /**
   * AgentState findFirst
   */
  export type AgentStateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * Filter, which AgentState to fetch.
     */
    where?: AgentStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentStates to fetch.
     */
    orderBy?: AgentStateOrderByWithRelationInput | AgentStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentStates.
     */
    cursor?: AgentStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentStates.
     */
    distinct?: AgentStateScalarFieldEnum | AgentStateScalarFieldEnum[]
  }

  /**
   * AgentState findFirstOrThrow
   */
  export type AgentStateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * Filter, which AgentState to fetch.
     */
    where?: AgentStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentStates to fetch.
     */
    orderBy?: AgentStateOrderByWithRelationInput | AgentStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentStates.
     */
    cursor?: AgentStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentStates.
     */
    distinct?: AgentStateScalarFieldEnum | AgentStateScalarFieldEnum[]
  }

  /**
   * AgentState findMany
   */
  export type AgentStateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * Filter, which AgentStates to fetch.
     */
    where?: AgentStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentStates to fetch.
     */
    orderBy?: AgentStateOrderByWithRelationInput | AgentStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AgentStates.
     */
    cursor?: AgentStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentStates.
     */
    skip?: number
    distinct?: AgentStateScalarFieldEnum | AgentStateScalarFieldEnum[]
  }

  /**
   * AgentState create
   */
  export type AgentStateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * The data needed to create a AgentState.
     */
    data: XOR<AgentStateCreateInput, AgentStateUncheckedCreateInput>
  }

  /**
   * AgentState createMany
   */
  export type AgentStateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AgentStates.
     */
    data: AgentStateCreateManyInput | AgentStateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AgentState createManyAndReturn
   */
  export type AgentStateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * The data used to create many AgentStates.
     */
    data: AgentStateCreateManyInput | AgentStateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AgentState update
   */
  export type AgentStateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * The data needed to update a AgentState.
     */
    data: XOR<AgentStateUpdateInput, AgentStateUncheckedUpdateInput>
    /**
     * Choose, which AgentState to update.
     */
    where: AgentStateWhereUniqueInput
  }

  /**
   * AgentState updateMany
   */
  export type AgentStateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AgentStates.
     */
    data: XOR<AgentStateUpdateManyMutationInput, AgentStateUncheckedUpdateManyInput>
    /**
     * Filter which AgentStates to update
     */
    where?: AgentStateWhereInput
  }

  /**
   * AgentState updateManyAndReturn
   */
  export type AgentStateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * The data used to update AgentStates.
     */
    data: XOR<AgentStateUpdateManyMutationInput, AgentStateUncheckedUpdateManyInput>
    /**
     * Filter which AgentStates to update
     */
    where?: AgentStateWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AgentState upsert
   */
  export type AgentStateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * The filter to search for the AgentState to update in case it exists.
     */
    where: AgentStateWhereUniqueInput
    /**
     * In case the AgentState found by the `where` argument doesn't exist, create a new AgentState with this data.
     */
    create: XOR<AgentStateCreateInput, AgentStateUncheckedCreateInput>
    /**
     * In case the AgentState was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentStateUpdateInput, AgentStateUncheckedUpdateInput>
  }

  /**
   * AgentState delete
   */
  export type AgentStateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
    /**
     * Filter which AgentState to delete.
     */
    where: AgentStateWhereUniqueInput
  }

  /**
   * AgentState deleteMany
   */
  export type AgentStateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentStates to delete
     */
    where?: AgentStateWhereInput
  }

  /**
   * AgentState without action
   */
  export type AgentStateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentState
     */
    select?: AgentStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentState
     */
    omit?: AgentStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentStateInclude<ExtArgs> | null
  }


  /**
   * Model Cooldown
   */

  export type AggregateCooldown = {
    _count: CooldownCountAggregateOutputType | null
    _min: CooldownMinAggregateOutputType | null
    _max: CooldownMaxAggregateOutputType | null
  }

  export type CooldownMinAggregateOutputType = {
    id: string | null
    type: $Enums.CooldownType | null
    endsAt: Date | null
    agentId: string | null
    targetAgentId: string | null
    gameId: string | null
  }

  export type CooldownMaxAggregateOutputType = {
    id: string | null
    type: $Enums.CooldownType | null
    endsAt: Date | null
    agentId: string | null
    targetAgentId: string | null
    gameId: string | null
  }

  export type CooldownCountAggregateOutputType = {
    id: number
    type: number
    endsAt: number
    agentId: number
    targetAgentId: number
    gameId: number
    _all: number
  }


  export type CooldownMinAggregateInputType = {
    id?: true
    type?: true
    endsAt?: true
    agentId?: true
    targetAgentId?: true
    gameId?: true
  }

  export type CooldownMaxAggregateInputType = {
    id?: true
    type?: true
    endsAt?: true
    agentId?: true
    targetAgentId?: true
    gameId?: true
  }

  export type CooldownCountAggregateInputType = {
    id?: true
    type?: true
    endsAt?: true
    agentId?: true
    targetAgentId?: true
    gameId?: true
    _all?: true
  }

  export type CooldownAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cooldown to aggregate.
     */
    where?: CooldownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cooldowns to fetch.
     */
    orderBy?: CooldownOrderByWithRelationInput | CooldownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CooldownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cooldowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cooldowns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Cooldowns
    **/
    _count?: true | CooldownCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CooldownMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CooldownMaxAggregateInputType
  }

  export type GetCooldownAggregateType<T extends CooldownAggregateArgs> = {
        [P in keyof T & keyof AggregateCooldown]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCooldown[P]>
      : GetScalarType<T[P], AggregateCooldown[P]>
  }




  export type CooldownGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CooldownWhereInput
    orderBy?: CooldownOrderByWithAggregationInput | CooldownOrderByWithAggregationInput[]
    by: CooldownScalarFieldEnum[] | CooldownScalarFieldEnum
    having?: CooldownScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CooldownCountAggregateInputType | true
    _min?: CooldownMinAggregateInputType
    _max?: CooldownMaxAggregateInputType
  }

  export type CooldownGroupByOutputType = {
    id: string
    type: $Enums.CooldownType
    endsAt: Date
    agentId: string
    targetAgentId: string | null
    gameId: string
    _count: CooldownCountAggregateOutputType | null
    _min: CooldownMinAggregateOutputType | null
    _max: CooldownMaxAggregateOutputType | null
  }

  type GetCooldownGroupByPayload<T extends CooldownGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CooldownGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CooldownGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CooldownGroupByOutputType[P]>
            : GetScalarType<T[P], CooldownGroupByOutputType[P]>
        }
      >
    >


  export type CooldownSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    endsAt?: boolean
    agentId?: boolean
    targetAgentId?: boolean
    gameId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["cooldown"]>

  export type CooldownSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    endsAt?: boolean
    agentId?: boolean
    targetAgentId?: boolean
    gameId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["cooldown"]>

  export type CooldownSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    endsAt?: boolean
    agentId?: boolean
    targetAgentId?: boolean
    gameId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["cooldown"]>

  export type CooldownSelectScalar = {
    id?: boolean
    type?: boolean
    endsAt?: boolean
    agentId?: boolean
    targetAgentId?: boolean
    gameId?: boolean
  }

  export type CooldownOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "endsAt" | "agentId" | "targetAgentId" | "gameId", ExtArgs["result"]["cooldown"]>
  export type CooldownInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }
  export type CooldownIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }
  export type CooldownIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
  }

  export type $CooldownPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Cooldown"
    objects: {
      agent: Prisma.$AgentPayload<ExtArgs>
      game: Prisma.$GamePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: $Enums.CooldownType
      endsAt: Date
      agentId: string
      targetAgentId: string | null
      gameId: string
    }, ExtArgs["result"]["cooldown"]>
    composites: {}
  }

  type CooldownGetPayload<S extends boolean | null | undefined | CooldownDefaultArgs> = $Result.GetResult<Prisma.$CooldownPayload, S>

  type CooldownCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CooldownFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CooldownCountAggregateInputType | true
    }

  export interface CooldownDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Cooldown'], meta: { name: 'Cooldown' } }
    /**
     * Find zero or one Cooldown that matches the filter.
     * @param {CooldownFindUniqueArgs} args - Arguments to find a Cooldown
     * @example
     * // Get one Cooldown
     * const cooldown = await prisma.cooldown.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CooldownFindUniqueArgs>(args: SelectSubset<T, CooldownFindUniqueArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Cooldown that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CooldownFindUniqueOrThrowArgs} args - Arguments to find a Cooldown
     * @example
     * // Get one Cooldown
     * const cooldown = await prisma.cooldown.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CooldownFindUniqueOrThrowArgs>(args: SelectSubset<T, CooldownFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Cooldown that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CooldownFindFirstArgs} args - Arguments to find a Cooldown
     * @example
     * // Get one Cooldown
     * const cooldown = await prisma.cooldown.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CooldownFindFirstArgs>(args?: SelectSubset<T, CooldownFindFirstArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Cooldown that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CooldownFindFirstOrThrowArgs} args - Arguments to find a Cooldown
     * @example
     * // Get one Cooldown
     * const cooldown = await prisma.cooldown.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CooldownFindFirstOrThrowArgs>(args?: SelectSubset<T, CooldownFindFirstOrThrowArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Cooldowns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CooldownFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Cooldowns
     * const cooldowns = await prisma.cooldown.findMany()
     * 
     * // Get first 10 Cooldowns
     * const cooldowns = await prisma.cooldown.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const cooldownWithIdOnly = await prisma.cooldown.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CooldownFindManyArgs>(args?: SelectSubset<T, CooldownFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Cooldown.
     * @param {CooldownCreateArgs} args - Arguments to create a Cooldown.
     * @example
     * // Create one Cooldown
     * const Cooldown = await prisma.cooldown.create({
     *   data: {
     *     // ... data to create a Cooldown
     *   }
     * })
     * 
     */
    create<T extends CooldownCreateArgs>(args: SelectSubset<T, CooldownCreateArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Cooldowns.
     * @param {CooldownCreateManyArgs} args - Arguments to create many Cooldowns.
     * @example
     * // Create many Cooldowns
     * const cooldown = await prisma.cooldown.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CooldownCreateManyArgs>(args?: SelectSubset<T, CooldownCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Cooldowns and returns the data saved in the database.
     * @param {CooldownCreateManyAndReturnArgs} args - Arguments to create many Cooldowns.
     * @example
     * // Create many Cooldowns
     * const cooldown = await prisma.cooldown.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Cooldowns and only return the `id`
     * const cooldownWithIdOnly = await prisma.cooldown.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CooldownCreateManyAndReturnArgs>(args?: SelectSubset<T, CooldownCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Cooldown.
     * @param {CooldownDeleteArgs} args - Arguments to delete one Cooldown.
     * @example
     * // Delete one Cooldown
     * const Cooldown = await prisma.cooldown.delete({
     *   where: {
     *     // ... filter to delete one Cooldown
     *   }
     * })
     * 
     */
    delete<T extends CooldownDeleteArgs>(args: SelectSubset<T, CooldownDeleteArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Cooldown.
     * @param {CooldownUpdateArgs} args - Arguments to update one Cooldown.
     * @example
     * // Update one Cooldown
     * const cooldown = await prisma.cooldown.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CooldownUpdateArgs>(args: SelectSubset<T, CooldownUpdateArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Cooldowns.
     * @param {CooldownDeleteManyArgs} args - Arguments to filter Cooldowns to delete.
     * @example
     * // Delete a few Cooldowns
     * const { count } = await prisma.cooldown.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CooldownDeleteManyArgs>(args?: SelectSubset<T, CooldownDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cooldowns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CooldownUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Cooldowns
     * const cooldown = await prisma.cooldown.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CooldownUpdateManyArgs>(args: SelectSubset<T, CooldownUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cooldowns and returns the data updated in the database.
     * @param {CooldownUpdateManyAndReturnArgs} args - Arguments to update many Cooldowns.
     * @example
     * // Update many Cooldowns
     * const cooldown = await prisma.cooldown.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Cooldowns and only return the `id`
     * const cooldownWithIdOnly = await prisma.cooldown.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CooldownUpdateManyAndReturnArgs>(args: SelectSubset<T, CooldownUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Cooldown.
     * @param {CooldownUpsertArgs} args - Arguments to update or create a Cooldown.
     * @example
     * // Update or create a Cooldown
     * const cooldown = await prisma.cooldown.upsert({
     *   create: {
     *     // ... data to create a Cooldown
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Cooldown we want to update
     *   }
     * })
     */
    upsert<T extends CooldownUpsertArgs>(args: SelectSubset<T, CooldownUpsertArgs<ExtArgs>>): Prisma__CooldownClient<$Result.GetResult<Prisma.$CooldownPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Cooldowns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CooldownCountArgs} args - Arguments to filter Cooldowns to count.
     * @example
     * // Count the number of Cooldowns
     * const count = await prisma.cooldown.count({
     *   where: {
     *     // ... the filter for the Cooldowns we want to count
     *   }
     * })
    **/
    count<T extends CooldownCountArgs>(
      args?: Subset<T, CooldownCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CooldownCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Cooldown.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CooldownAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CooldownAggregateArgs>(args: Subset<T, CooldownAggregateArgs>): Prisma.PrismaPromise<GetCooldownAggregateType<T>>

    /**
     * Group by Cooldown.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CooldownGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CooldownGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CooldownGroupByArgs['orderBy'] }
        : { orderBy?: CooldownGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CooldownGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCooldownGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Cooldown model
   */
  readonly fields: CooldownFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Cooldown.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CooldownClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    game<T extends GameDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GameDefaultArgs<ExtArgs>>): Prisma__GameClient<$Result.GetResult<Prisma.$GamePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Cooldown model
   */ 
  interface CooldownFieldRefs {
    readonly id: FieldRef<"Cooldown", 'String'>
    readonly type: FieldRef<"Cooldown", 'CooldownType'>
    readonly endsAt: FieldRef<"Cooldown", 'DateTime'>
    readonly agentId: FieldRef<"Cooldown", 'String'>
    readonly targetAgentId: FieldRef<"Cooldown", 'String'>
    readonly gameId: FieldRef<"Cooldown", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Cooldown findUnique
   */
  export type CooldownFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * Filter, which Cooldown to fetch.
     */
    where: CooldownWhereUniqueInput
  }

  /**
   * Cooldown findUniqueOrThrow
   */
  export type CooldownFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * Filter, which Cooldown to fetch.
     */
    where: CooldownWhereUniqueInput
  }

  /**
   * Cooldown findFirst
   */
  export type CooldownFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * Filter, which Cooldown to fetch.
     */
    where?: CooldownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cooldowns to fetch.
     */
    orderBy?: CooldownOrderByWithRelationInput | CooldownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cooldowns.
     */
    cursor?: CooldownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cooldowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cooldowns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cooldowns.
     */
    distinct?: CooldownScalarFieldEnum | CooldownScalarFieldEnum[]
  }

  /**
   * Cooldown findFirstOrThrow
   */
  export type CooldownFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * Filter, which Cooldown to fetch.
     */
    where?: CooldownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cooldowns to fetch.
     */
    orderBy?: CooldownOrderByWithRelationInput | CooldownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cooldowns.
     */
    cursor?: CooldownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cooldowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cooldowns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cooldowns.
     */
    distinct?: CooldownScalarFieldEnum | CooldownScalarFieldEnum[]
  }

  /**
   * Cooldown findMany
   */
  export type CooldownFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * Filter, which Cooldowns to fetch.
     */
    where?: CooldownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cooldowns to fetch.
     */
    orderBy?: CooldownOrderByWithRelationInput | CooldownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Cooldowns.
     */
    cursor?: CooldownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cooldowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cooldowns.
     */
    skip?: number
    distinct?: CooldownScalarFieldEnum | CooldownScalarFieldEnum[]
  }

  /**
   * Cooldown create
   */
  export type CooldownCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * The data needed to create a Cooldown.
     */
    data: XOR<CooldownCreateInput, CooldownUncheckedCreateInput>
  }

  /**
   * Cooldown createMany
   */
  export type CooldownCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Cooldowns.
     */
    data: CooldownCreateManyInput | CooldownCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Cooldown createManyAndReturn
   */
  export type CooldownCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * The data used to create many Cooldowns.
     */
    data: CooldownCreateManyInput | CooldownCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Cooldown update
   */
  export type CooldownUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * The data needed to update a Cooldown.
     */
    data: XOR<CooldownUpdateInput, CooldownUncheckedUpdateInput>
    /**
     * Choose, which Cooldown to update.
     */
    where: CooldownWhereUniqueInput
  }

  /**
   * Cooldown updateMany
   */
  export type CooldownUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Cooldowns.
     */
    data: XOR<CooldownUpdateManyMutationInput, CooldownUncheckedUpdateManyInput>
    /**
     * Filter which Cooldowns to update
     */
    where?: CooldownWhereInput
  }

  /**
   * Cooldown updateManyAndReturn
   */
  export type CooldownUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * The data used to update Cooldowns.
     */
    data: XOR<CooldownUpdateManyMutationInput, CooldownUncheckedUpdateManyInput>
    /**
     * Filter which Cooldowns to update
     */
    where?: CooldownWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Cooldown upsert
   */
  export type CooldownUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * The filter to search for the Cooldown to update in case it exists.
     */
    where: CooldownWhereUniqueInput
    /**
     * In case the Cooldown found by the `where` argument doesn't exist, create a new Cooldown with this data.
     */
    create: XOR<CooldownCreateInput, CooldownUncheckedCreateInput>
    /**
     * In case the Cooldown was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CooldownUpdateInput, CooldownUncheckedUpdateInput>
  }

  /**
   * Cooldown delete
   */
  export type CooldownDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
    /**
     * Filter which Cooldown to delete.
     */
    where: CooldownWhereUniqueInput
  }

  /**
   * Cooldown deleteMany
   */
  export type CooldownDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cooldowns to delete
     */
    where?: CooldownWhereInput
  }

  /**
   * Cooldown without action
   */
  export type CooldownDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cooldown
     */
    select?: CooldownSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cooldown
     */
    omit?: CooldownOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CooldownInclude<ExtArgs> | null
  }


  /**
   * Model Strategy
   */

  export type AggregateStrategy = {
    _count: StrategyCountAggregateOutputType | null
    _avg: StrategyAvgAggregateOutputType | null
    _sum: StrategySumAggregateOutputType | null
    _min: StrategyMinAggregateOutputType | null
    _max: StrategyMaxAggregateOutputType | null
  }

  export type StrategyAvgAggregateOutputType = {
    deceptionLevel: number | null
  }

  export type StrategySumAggregateOutputType = {
    deceptionLevel: number | null
  }

  export type StrategyMinAggregateOutputType = {
    id: string | null
    publicStrategy: string | null
    actualStrategy: string | null
    deceptionLevel: number | null
    agentId: string | null
  }

  export type StrategyMaxAggregateOutputType = {
    id: string | null
    publicStrategy: string | null
    actualStrategy: string | null
    deceptionLevel: number | null
    agentId: string | null
  }

  export type StrategyCountAggregateOutputType = {
    id: number
    publicStrategy: number
    actualStrategy: number
    deceptionLevel: number
    agentId: number
    _all: number
  }


  export type StrategyAvgAggregateInputType = {
    deceptionLevel?: true
  }

  export type StrategySumAggregateInputType = {
    deceptionLevel?: true
  }

  export type StrategyMinAggregateInputType = {
    id?: true
    publicStrategy?: true
    actualStrategy?: true
    deceptionLevel?: true
    agentId?: true
  }

  export type StrategyMaxAggregateInputType = {
    id?: true
    publicStrategy?: true
    actualStrategy?: true
    deceptionLevel?: true
    agentId?: true
  }

  export type StrategyCountAggregateInputType = {
    id?: true
    publicStrategy?: true
    actualStrategy?: true
    deceptionLevel?: true
    agentId?: true
    _all?: true
  }

  export type StrategyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Strategy to aggregate.
     */
    where?: StrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Strategies to fetch.
     */
    orderBy?: StrategyOrderByWithRelationInput | StrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Strategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Strategies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Strategies
    **/
    _count?: true | StrategyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StrategyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StrategySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StrategyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StrategyMaxAggregateInputType
  }

  export type GetStrategyAggregateType<T extends StrategyAggregateArgs> = {
        [P in keyof T & keyof AggregateStrategy]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStrategy[P]>
      : GetScalarType<T[P], AggregateStrategy[P]>
  }




  export type StrategyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StrategyWhereInput
    orderBy?: StrategyOrderByWithAggregationInput | StrategyOrderByWithAggregationInput[]
    by: StrategyScalarFieldEnum[] | StrategyScalarFieldEnum
    having?: StrategyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StrategyCountAggregateInputType | true
    _avg?: StrategyAvgAggregateInputType
    _sum?: StrategySumAggregateInputType
    _min?: StrategyMinAggregateInputType
    _max?: StrategyMaxAggregateInputType
  }

  export type StrategyGroupByOutputType = {
    id: string
    publicStrategy: string
    actualStrategy: string
    deceptionLevel: number
    agentId: string
    _count: StrategyCountAggregateOutputType | null
    _avg: StrategyAvgAggregateOutputType | null
    _sum: StrategySumAggregateOutputType | null
    _min: StrategyMinAggregateOutputType | null
    _max: StrategyMaxAggregateOutputType | null
  }

  type GetStrategyGroupByPayload<T extends StrategyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StrategyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StrategyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StrategyGroupByOutputType[P]>
            : GetScalarType<T[P], StrategyGroupByOutputType[P]>
        }
      >
    >


  export type StrategySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    publicStrategy?: boolean
    actualStrategy?: boolean
    deceptionLevel?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["strategy"]>

  export type StrategySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    publicStrategy?: boolean
    actualStrategy?: boolean
    deceptionLevel?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["strategy"]>

  export type StrategySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    publicStrategy?: boolean
    actualStrategy?: boolean
    deceptionLevel?: boolean
    agentId?: boolean
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["strategy"]>

  export type StrategySelectScalar = {
    id?: boolean
    publicStrategy?: boolean
    actualStrategy?: boolean
    deceptionLevel?: boolean
    agentId?: boolean
  }

  export type StrategyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "publicStrategy" | "actualStrategy" | "deceptionLevel" | "agentId", ExtArgs["result"]["strategy"]>
  export type StrategyInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type StrategyIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }
  export type StrategyIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    agent?: boolean | AgentDefaultArgs<ExtArgs>
  }

  export type $StrategyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Strategy"
    objects: {
      agent: Prisma.$AgentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      publicStrategy: string
      actualStrategy: string
      deceptionLevel: number
      agentId: string
    }, ExtArgs["result"]["strategy"]>
    composites: {}
  }

  type StrategyGetPayload<S extends boolean | null | undefined | StrategyDefaultArgs> = $Result.GetResult<Prisma.$StrategyPayload, S>

  type StrategyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StrategyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StrategyCountAggregateInputType | true
    }

  export interface StrategyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Strategy'], meta: { name: 'Strategy' } }
    /**
     * Find zero or one Strategy that matches the filter.
     * @param {StrategyFindUniqueArgs} args - Arguments to find a Strategy
     * @example
     * // Get one Strategy
     * const strategy = await prisma.strategy.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StrategyFindUniqueArgs>(args: SelectSubset<T, StrategyFindUniqueArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Strategy that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StrategyFindUniqueOrThrowArgs} args - Arguments to find a Strategy
     * @example
     * // Get one Strategy
     * const strategy = await prisma.strategy.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StrategyFindUniqueOrThrowArgs>(args: SelectSubset<T, StrategyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Strategy that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StrategyFindFirstArgs} args - Arguments to find a Strategy
     * @example
     * // Get one Strategy
     * const strategy = await prisma.strategy.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StrategyFindFirstArgs>(args?: SelectSubset<T, StrategyFindFirstArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Strategy that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StrategyFindFirstOrThrowArgs} args - Arguments to find a Strategy
     * @example
     * // Get one Strategy
     * const strategy = await prisma.strategy.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StrategyFindFirstOrThrowArgs>(args?: SelectSubset<T, StrategyFindFirstOrThrowArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Strategies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StrategyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Strategies
     * const strategies = await prisma.strategy.findMany()
     * 
     * // Get first 10 Strategies
     * const strategies = await prisma.strategy.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const strategyWithIdOnly = await prisma.strategy.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StrategyFindManyArgs>(args?: SelectSubset<T, StrategyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Strategy.
     * @param {StrategyCreateArgs} args - Arguments to create a Strategy.
     * @example
     * // Create one Strategy
     * const Strategy = await prisma.strategy.create({
     *   data: {
     *     // ... data to create a Strategy
     *   }
     * })
     * 
     */
    create<T extends StrategyCreateArgs>(args: SelectSubset<T, StrategyCreateArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Strategies.
     * @param {StrategyCreateManyArgs} args - Arguments to create many Strategies.
     * @example
     * // Create many Strategies
     * const strategy = await prisma.strategy.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StrategyCreateManyArgs>(args?: SelectSubset<T, StrategyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Strategies and returns the data saved in the database.
     * @param {StrategyCreateManyAndReturnArgs} args - Arguments to create many Strategies.
     * @example
     * // Create many Strategies
     * const strategy = await prisma.strategy.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Strategies and only return the `id`
     * const strategyWithIdOnly = await prisma.strategy.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StrategyCreateManyAndReturnArgs>(args?: SelectSubset<T, StrategyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Strategy.
     * @param {StrategyDeleteArgs} args - Arguments to delete one Strategy.
     * @example
     * // Delete one Strategy
     * const Strategy = await prisma.strategy.delete({
     *   where: {
     *     // ... filter to delete one Strategy
     *   }
     * })
     * 
     */
    delete<T extends StrategyDeleteArgs>(args: SelectSubset<T, StrategyDeleteArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Strategy.
     * @param {StrategyUpdateArgs} args - Arguments to update one Strategy.
     * @example
     * // Update one Strategy
     * const strategy = await prisma.strategy.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StrategyUpdateArgs>(args: SelectSubset<T, StrategyUpdateArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Strategies.
     * @param {StrategyDeleteManyArgs} args - Arguments to filter Strategies to delete.
     * @example
     * // Delete a few Strategies
     * const { count } = await prisma.strategy.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StrategyDeleteManyArgs>(args?: SelectSubset<T, StrategyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Strategies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StrategyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Strategies
     * const strategy = await prisma.strategy.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StrategyUpdateManyArgs>(args: SelectSubset<T, StrategyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Strategies and returns the data updated in the database.
     * @param {StrategyUpdateManyAndReturnArgs} args - Arguments to update many Strategies.
     * @example
     * // Update many Strategies
     * const strategy = await prisma.strategy.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Strategies and only return the `id`
     * const strategyWithIdOnly = await prisma.strategy.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends StrategyUpdateManyAndReturnArgs>(args: SelectSubset<T, StrategyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Strategy.
     * @param {StrategyUpsertArgs} args - Arguments to update or create a Strategy.
     * @example
     * // Update or create a Strategy
     * const strategy = await prisma.strategy.upsert({
     *   create: {
     *     // ... data to create a Strategy
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Strategy we want to update
     *   }
     * })
     */
    upsert<T extends StrategyUpsertArgs>(args: SelectSubset<T, StrategyUpsertArgs<ExtArgs>>): Prisma__StrategyClient<$Result.GetResult<Prisma.$StrategyPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Strategies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StrategyCountArgs} args - Arguments to filter Strategies to count.
     * @example
     * // Count the number of Strategies
     * const count = await prisma.strategy.count({
     *   where: {
     *     // ... the filter for the Strategies we want to count
     *   }
     * })
    **/
    count<T extends StrategyCountArgs>(
      args?: Subset<T, StrategyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StrategyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Strategy.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StrategyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StrategyAggregateArgs>(args: Subset<T, StrategyAggregateArgs>): Prisma.PrismaPromise<GetStrategyAggregateType<T>>

    /**
     * Group by Strategy.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StrategyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StrategyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StrategyGroupByArgs['orderBy'] }
        : { orderBy?: StrategyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StrategyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStrategyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Strategy model
   */
  readonly fields: StrategyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Strategy.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StrategyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    agent<T extends AgentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentDefaultArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Strategy model
   */ 
  interface StrategyFieldRefs {
    readonly id: FieldRef<"Strategy", 'String'>
    readonly publicStrategy: FieldRef<"Strategy", 'String'>
    readonly actualStrategy: FieldRef<"Strategy", 'String'>
    readonly deceptionLevel: FieldRef<"Strategy", 'Int'>
    readonly agentId: FieldRef<"Strategy", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Strategy findUnique
   */
  export type StrategyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * Filter, which Strategy to fetch.
     */
    where: StrategyWhereUniqueInput
  }

  /**
   * Strategy findUniqueOrThrow
   */
  export type StrategyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * Filter, which Strategy to fetch.
     */
    where: StrategyWhereUniqueInput
  }

  /**
   * Strategy findFirst
   */
  export type StrategyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * Filter, which Strategy to fetch.
     */
    where?: StrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Strategies to fetch.
     */
    orderBy?: StrategyOrderByWithRelationInput | StrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Strategies.
     */
    cursor?: StrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Strategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Strategies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Strategies.
     */
    distinct?: StrategyScalarFieldEnum | StrategyScalarFieldEnum[]
  }

  /**
   * Strategy findFirstOrThrow
   */
  export type StrategyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * Filter, which Strategy to fetch.
     */
    where?: StrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Strategies to fetch.
     */
    orderBy?: StrategyOrderByWithRelationInput | StrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Strategies.
     */
    cursor?: StrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Strategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Strategies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Strategies.
     */
    distinct?: StrategyScalarFieldEnum | StrategyScalarFieldEnum[]
  }

  /**
   * Strategy findMany
   */
  export type StrategyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * Filter, which Strategies to fetch.
     */
    where?: StrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Strategies to fetch.
     */
    orderBy?: StrategyOrderByWithRelationInput | StrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Strategies.
     */
    cursor?: StrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Strategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Strategies.
     */
    skip?: number
    distinct?: StrategyScalarFieldEnum | StrategyScalarFieldEnum[]
  }

  /**
   * Strategy create
   */
  export type StrategyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * The data needed to create a Strategy.
     */
    data: XOR<StrategyCreateInput, StrategyUncheckedCreateInput>
  }

  /**
   * Strategy createMany
   */
  export type StrategyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Strategies.
     */
    data: StrategyCreateManyInput | StrategyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Strategy createManyAndReturn
   */
  export type StrategyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * The data used to create many Strategies.
     */
    data: StrategyCreateManyInput | StrategyCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Strategy update
   */
  export type StrategyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * The data needed to update a Strategy.
     */
    data: XOR<StrategyUpdateInput, StrategyUncheckedUpdateInput>
    /**
     * Choose, which Strategy to update.
     */
    where: StrategyWhereUniqueInput
  }

  /**
   * Strategy updateMany
   */
  export type StrategyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Strategies.
     */
    data: XOR<StrategyUpdateManyMutationInput, StrategyUncheckedUpdateManyInput>
    /**
     * Filter which Strategies to update
     */
    where?: StrategyWhereInput
  }

  /**
   * Strategy updateManyAndReturn
   */
  export type StrategyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * The data used to update Strategies.
     */
    data: XOR<StrategyUpdateManyMutationInput, StrategyUncheckedUpdateManyInput>
    /**
     * Filter which Strategies to update
     */
    where?: StrategyWhereInput
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Strategy upsert
   */
  export type StrategyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * The filter to search for the Strategy to update in case it exists.
     */
    where: StrategyWhereUniqueInput
    /**
     * In case the Strategy found by the `where` argument doesn't exist, create a new Strategy with this data.
     */
    create: XOR<StrategyCreateInput, StrategyUncheckedCreateInput>
    /**
     * In case the Strategy was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StrategyUpdateInput, StrategyUncheckedUpdateInput>
  }

  /**
   * Strategy delete
   */
  export type StrategyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
    /**
     * Filter which Strategy to delete.
     */
    where: StrategyWhereUniqueInput
  }

  /**
   * Strategy deleteMany
   */
  export type StrategyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Strategies to delete
     */
    where?: StrategyWhereInput
  }

  /**
   * Strategy without action
   */
  export type StrategyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Strategy
     */
    select?: StrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Strategy
     */
    omit?: StrategyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StrategyInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    privyUserId: string | null
    role: $Enums.UserRole | null
    email: string | null
    walletAddress: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    privyUserId: string | null
    role: $Enums.UserRole | null
    email: string | null
    walletAddress: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    privyUserId: number
    role: number
    email: number
    walletAddress: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    privyUserId?: true
    role?: true
    email?: true
    walletAddress?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    privyUserId?: true
    role?: true
    email?: true
    walletAddress?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    privyUserId?: true
    role?: true
    email?: true
    walletAddress?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    privyUserId: string
    role: $Enums.UserRole
    email: string | null
    walletAddress: string | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    privyUserId?: boolean
    role?: boolean
    email?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    privyUserId?: boolean
    role?: boolean
    email?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    privyUserId?: boolean
    role?: boolean
    email?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    privyUserId?: boolean
    role?: boolean
    email?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "privyUserId" | "role" | "email" | "walletAddress" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      privyUserId: string
      role: $Enums.UserRole
      email: string | null
      walletAddress: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly privyUserId: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'UserRole'>
    readonly email: FieldRef<"User", 'String'>
    readonly walletAddress: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const GameScalarFieldEnum: {
    id: 'id',
    gameId: 'gameId',
    authority: 'authority',
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

  export type GameScalarFieldEnum = (typeof GameScalarFieldEnum)[keyof typeof GameScalarFieldEnum]


  export const AgentProfileScalarFieldEnum: {
    id: 'id',
    onchainId: 'onchainId',
    name: 'name',
    xHandle: 'xHandle',
    bio: 'bio',
    lore: 'lore',
    characteristics: 'characteristics',
    knowledge: 'knowledge',
    traits: 'traits'
  };

  export type AgentProfileScalarFieldEnum = (typeof AgentProfileScalarFieldEnum)[keyof typeof AgentProfileScalarFieldEnum]


  export const AgentScalarFieldEnum: {
    id: 'id',
    agentId: 'agentId',
    publicKey: 'publicKey',
    agentProfileId: 'agentProfileId',
    health: 'health',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    gameId: 'gameId'
  };

  export type AgentScalarFieldEnum = (typeof AgentScalarFieldEnum)[keyof typeof AgentScalarFieldEnum]


  export const TweetScalarFieldEnum: {
    id: 'id',
    agentId: 'agentId',
    content: 'content',
    type: 'type',
    timestamp: 'timestamp',
    conversationId: 'conversationId'
  };

  export type TweetScalarFieldEnum = (typeof TweetScalarFieldEnum)[keyof typeof TweetScalarFieldEnum]


  export const LocationScalarFieldEnum: {
    id: 'id',
    x: 'x',
    y: 'y',
    terrainType: 'terrainType',
    agentId: 'agentId'
  };

  export type LocationScalarFieldEnum = (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum]


  export const AllianceScalarFieldEnum: {
    id: 'id',
    formedAt: 'formedAt',
    combinedTokens: 'combinedTokens',
    status: 'status',
    gameId: 'gameId',
    agentId: 'agentId',
    alliedAgentId: 'alliedAgentId'
  };

  export type AllianceScalarFieldEnum = (typeof AllianceScalarFieldEnum)[keyof typeof AllianceScalarFieldEnum]


  export const BattleScalarFieldEnum: {
    id: 'id',
    timestamp: 'timestamp',
    outcome: 'outcome',
    tokensLost: 'tokensLost',
    tokensGained: 'tokensGained',
    probability: 'probability',
    gameId: 'gameId',
    agentId: 'agentId',
    opponentId: 'opponentId',
    type: 'type',
    status: 'status',
    startTime: 'startTime',
    resolutionTime: 'resolutionTime',
    resolvedAt: 'resolvedAt'
  };

  export type BattleScalarFieldEnum = (typeof BattleScalarFieldEnum)[keyof typeof BattleScalarFieldEnum]


  export const InteractionScalarFieldEnum: {
    id: 'id',
    tweetId: 'tweetId',
    userId: 'userId',
    type: 'type',
    content: 'content',
    timestamp: 'timestamp',
    userMetrics: 'userMetrics'
  };

  export type InteractionScalarFieldEnum = (typeof InteractionScalarFieldEnum)[keyof typeof InteractionScalarFieldEnum]


  export const AgentStateScalarFieldEnum: {
    id: 'id',
    isAlive: 'isAlive',
    lastActionType: 'lastActionType',
    lastActionTime: 'lastActionTime',
    lastActionDetails: 'lastActionDetails',
    influencedByTweet: 'influencedByTweet',
    influenceScore: 'influenceScore',
    agentId: 'agentId'
  };

  export type AgentStateScalarFieldEnum = (typeof AgentStateScalarFieldEnum)[keyof typeof AgentStateScalarFieldEnum]


  export const CooldownScalarFieldEnum: {
    id: 'id',
    type: 'type',
    endsAt: 'endsAt',
    agentId: 'agentId',
    targetAgentId: 'targetAgentId',
    gameId: 'gameId'
  };

  export type CooldownScalarFieldEnum = (typeof CooldownScalarFieldEnum)[keyof typeof CooldownScalarFieldEnum]


  export const StrategyScalarFieldEnum: {
    id: 'id',
    publicStrategy: 'publicStrategy',
    actualStrategy: 'actualStrategy',
    deceptionLevel: 'deceptionLevel',
    agentId: 'agentId'
  };

  export type StrategyScalarFieldEnum = (typeof StrategyScalarFieldEnum)[keyof typeof StrategyScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    privyUserId: 'privyUserId',
    role: 'role',
    email: 'email',
    walletAddress: 'walletAddress',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'TerrainType'
   */
  export type EnumTerrainTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TerrainType'>
    


  /**
   * Reference to a field of type 'TerrainType[]'
   */
  export type ListEnumTerrainTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TerrainType[]'>
    


  /**
   * Reference to a field of type 'AllianceStatus'
   */
  export type EnumAllianceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AllianceStatus'>
    


  /**
   * Reference to a field of type 'AllianceStatus[]'
   */
  export type ListEnumAllianceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AllianceStatus[]'>
    


  /**
   * Reference to a field of type 'BattleType'
   */
  export type EnumBattleTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BattleType'>
    


  /**
   * Reference to a field of type 'BattleType[]'
   */
  export type ListEnumBattleTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BattleType[]'>
    


  /**
   * Reference to a field of type 'BattleStatus'
   */
  export type EnumBattleStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BattleStatus'>
    


  /**
   * Reference to a field of type 'BattleStatus[]'
   */
  export type ListEnumBattleStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BattleStatus[]'>
    


  /**
   * Reference to a field of type 'CooldownType'
   */
  export type EnumCooldownTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CooldownType'>
    


  /**
   * Reference to a field of type 'CooldownType[]'
   */
  export type ListEnumCooldownTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CooldownType[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    
  /**
   * Deep Input Types
   */


  export type GameWhereInput = {
    AND?: GameWhereInput | GameWhereInput[]
    OR?: GameWhereInput[]
    NOT?: GameWhereInput | GameWhereInput[]
    id?: StringFilter<"Game"> | string
    gameId?: BigIntFilter<"Game"> | bigint | number
    authority?: StringFilter<"Game"> | string
    tokenMint?: StringFilter<"Game"> | string
    rewardsVault?: StringFilter<"Game"> | string
    mapDiameter?: IntFilter<"Game"> | number
    isActive?: BoolFilter<"Game"> | boolean
    lastUpdate?: DateTimeFilter<"Game"> | Date | string
    bump?: IntFilter<"Game"> | number
    dailyRewardTokens?: FloatFilter<"Game"> | number
    createdAt?: DateTimeFilter<"Game"> | Date | string
    updatedAt?: DateTimeFilter<"Game"> | Date | string
    agents?: AgentListRelationFilter
    alliances?: AllianceListRelationFilter
    battles?: BattleListRelationFilter
    Cooldown?: CooldownListRelationFilter
  }

  export type GameOrderByWithRelationInput = {
    id?: SortOrder
    gameId?: SortOrder
    authority?: SortOrder
    tokenMint?: SortOrder
    rewardsVault?: SortOrder
    mapDiameter?: SortOrder
    isActive?: SortOrder
    lastUpdate?: SortOrder
    bump?: SortOrder
    dailyRewardTokens?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    agents?: AgentOrderByRelationAggregateInput
    alliances?: AllianceOrderByRelationAggregateInput
    battles?: BattleOrderByRelationAggregateInput
    Cooldown?: CooldownOrderByRelationAggregateInput
  }

  export type GameWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    gameId?: bigint | number
    AND?: GameWhereInput | GameWhereInput[]
    OR?: GameWhereInput[]
    NOT?: GameWhereInput | GameWhereInput[]
    authority?: StringFilter<"Game"> | string
    tokenMint?: StringFilter<"Game"> | string
    rewardsVault?: StringFilter<"Game"> | string
    mapDiameter?: IntFilter<"Game"> | number
    isActive?: BoolFilter<"Game"> | boolean
    lastUpdate?: DateTimeFilter<"Game"> | Date | string
    bump?: IntFilter<"Game"> | number
    dailyRewardTokens?: FloatFilter<"Game"> | number
    createdAt?: DateTimeFilter<"Game"> | Date | string
    updatedAt?: DateTimeFilter<"Game"> | Date | string
    agents?: AgentListRelationFilter
    alliances?: AllianceListRelationFilter
    battles?: BattleListRelationFilter
    Cooldown?: CooldownListRelationFilter
  }, "id" | "gameId">

  export type GameOrderByWithAggregationInput = {
    id?: SortOrder
    gameId?: SortOrder
    authority?: SortOrder
    tokenMint?: SortOrder
    rewardsVault?: SortOrder
    mapDiameter?: SortOrder
    isActive?: SortOrder
    lastUpdate?: SortOrder
    bump?: SortOrder
    dailyRewardTokens?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: GameCountOrderByAggregateInput
    _avg?: GameAvgOrderByAggregateInput
    _max?: GameMaxOrderByAggregateInput
    _min?: GameMinOrderByAggregateInput
    _sum?: GameSumOrderByAggregateInput
  }

  export type GameScalarWhereWithAggregatesInput = {
    AND?: GameScalarWhereWithAggregatesInput | GameScalarWhereWithAggregatesInput[]
    OR?: GameScalarWhereWithAggregatesInput[]
    NOT?: GameScalarWhereWithAggregatesInput | GameScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Game"> | string
    gameId?: BigIntWithAggregatesFilter<"Game"> | bigint | number
    authority?: StringWithAggregatesFilter<"Game"> | string
    tokenMint?: StringWithAggregatesFilter<"Game"> | string
    rewardsVault?: StringWithAggregatesFilter<"Game"> | string
    mapDiameter?: IntWithAggregatesFilter<"Game"> | number
    isActive?: BoolWithAggregatesFilter<"Game"> | boolean
    lastUpdate?: DateTimeWithAggregatesFilter<"Game"> | Date | string
    bump?: IntWithAggregatesFilter<"Game"> | number
    dailyRewardTokens?: FloatWithAggregatesFilter<"Game"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Game"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Game"> | Date | string
  }

  export type AgentProfileWhereInput = {
    AND?: AgentProfileWhereInput | AgentProfileWhereInput[]
    OR?: AgentProfileWhereInput[]
    NOT?: AgentProfileWhereInput | AgentProfileWhereInput[]
    id?: StringFilter<"AgentProfile"> | string
    onchainId?: IntFilter<"AgentProfile"> | number
    name?: StringFilter<"AgentProfile"> | string
    xHandle?: StringFilter<"AgentProfile"> | string
    bio?: StringNullableListFilter<"AgentProfile">
    lore?: StringNullableListFilter<"AgentProfile">
    characteristics?: StringNullableListFilter<"AgentProfile">
    knowledge?: StringNullableListFilter<"AgentProfile">
    traits?: JsonFilter<"AgentProfile">
    agent?: AgentListRelationFilter
  }

  export type AgentProfileOrderByWithRelationInput = {
    id?: SortOrder
    onchainId?: SortOrder
    name?: SortOrder
    xHandle?: SortOrder
    bio?: SortOrder
    lore?: SortOrder
    characteristics?: SortOrder
    knowledge?: SortOrder
    traits?: SortOrder
    agent?: AgentOrderByRelationAggregateInput
  }

  export type AgentProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    onchainId?: number
    xHandle?: string
    AND?: AgentProfileWhereInput | AgentProfileWhereInput[]
    OR?: AgentProfileWhereInput[]
    NOT?: AgentProfileWhereInput | AgentProfileWhereInput[]
    name?: StringFilter<"AgentProfile"> | string
    bio?: StringNullableListFilter<"AgentProfile">
    lore?: StringNullableListFilter<"AgentProfile">
    characteristics?: StringNullableListFilter<"AgentProfile">
    knowledge?: StringNullableListFilter<"AgentProfile">
    traits?: JsonFilter<"AgentProfile">
    agent?: AgentListRelationFilter
  }, "id" | "onchainId" | "xHandle">

  export type AgentProfileOrderByWithAggregationInput = {
    id?: SortOrder
    onchainId?: SortOrder
    name?: SortOrder
    xHandle?: SortOrder
    bio?: SortOrder
    lore?: SortOrder
    characteristics?: SortOrder
    knowledge?: SortOrder
    traits?: SortOrder
    _count?: AgentProfileCountOrderByAggregateInput
    _avg?: AgentProfileAvgOrderByAggregateInput
    _max?: AgentProfileMaxOrderByAggregateInput
    _min?: AgentProfileMinOrderByAggregateInput
    _sum?: AgentProfileSumOrderByAggregateInput
  }

  export type AgentProfileScalarWhereWithAggregatesInput = {
    AND?: AgentProfileScalarWhereWithAggregatesInput | AgentProfileScalarWhereWithAggregatesInput[]
    OR?: AgentProfileScalarWhereWithAggregatesInput[]
    NOT?: AgentProfileScalarWhereWithAggregatesInput | AgentProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AgentProfile"> | string
    onchainId?: IntWithAggregatesFilter<"AgentProfile"> | number
    name?: StringWithAggregatesFilter<"AgentProfile"> | string
    xHandle?: StringWithAggregatesFilter<"AgentProfile"> | string
    bio?: StringNullableListFilter<"AgentProfile">
    lore?: StringNullableListFilter<"AgentProfile">
    characteristics?: StringNullableListFilter<"AgentProfile">
    knowledge?: StringNullableListFilter<"AgentProfile">
    traits?: JsonWithAggregatesFilter<"AgentProfile">
  }

  export type AgentWhereInput = {
    AND?: AgentWhereInput | AgentWhereInput[]
    OR?: AgentWhereInput[]
    NOT?: AgentWhereInput | AgentWhereInput[]
    id?: StringFilter<"Agent"> | string
    agentId?: IntFilter<"Agent"> | number
    publicKey?: StringFilter<"Agent"> | string
    agentProfileId?: StringFilter<"Agent"> | string
    health?: IntFilter<"Agent"> | number
    createdAt?: DateTimeFilter<"Agent"> | Date | string
    updatedAt?: DateTimeFilter<"Agent"> | Date | string
    gameId?: StringFilter<"Agent"> | string
    agentProfile?: XOR<AgentProfileScalarRelationFilter, AgentProfileWhereInput>
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
    location?: XOR<LocationNullableScalarRelationFilter, LocationWhereInput> | null
    currentAlliance?: XOR<AllianceNullableScalarRelationFilter, AllianceWhereInput> | null
    battles?: BattleListRelationFilter
    state?: XOR<AgentStateNullableScalarRelationFilter, AgentStateWhereInput> | null
    strategy?: XOR<StrategyNullableScalarRelationFilter, StrategyWhereInput> | null
    cooldowns?: CooldownListRelationFilter
    alliedBy?: AllianceListRelationFilter
    battlesAsOpponent?: BattleListRelationFilter
    Tweet?: TweetListRelationFilter
  }

  export type AgentOrderByWithRelationInput = {
    id?: SortOrder
    agentId?: SortOrder
    publicKey?: SortOrder
    agentProfileId?: SortOrder
    health?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    gameId?: SortOrder
    agentProfile?: AgentProfileOrderByWithRelationInput
    game?: GameOrderByWithRelationInput
    location?: LocationOrderByWithRelationInput
    currentAlliance?: AllianceOrderByWithRelationInput
    battles?: BattleOrderByRelationAggregateInput
    state?: AgentStateOrderByWithRelationInput
    strategy?: StrategyOrderByWithRelationInput
    cooldowns?: CooldownOrderByRelationAggregateInput
    alliedBy?: AllianceOrderByRelationAggregateInput
    battlesAsOpponent?: BattleOrderByRelationAggregateInput
    Tweet?: TweetOrderByRelationAggregateInput
  }

  export type AgentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    agentId_gameId?: AgentAgentIdGameIdCompoundUniqueInput
    AND?: AgentWhereInput | AgentWhereInput[]
    OR?: AgentWhereInput[]
    NOT?: AgentWhereInput | AgentWhereInput[]
    agentId?: IntFilter<"Agent"> | number
    publicKey?: StringFilter<"Agent"> | string
    agentProfileId?: StringFilter<"Agent"> | string
    health?: IntFilter<"Agent"> | number
    createdAt?: DateTimeFilter<"Agent"> | Date | string
    updatedAt?: DateTimeFilter<"Agent"> | Date | string
    gameId?: StringFilter<"Agent"> | string
    agentProfile?: XOR<AgentProfileScalarRelationFilter, AgentProfileWhereInput>
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
    location?: XOR<LocationNullableScalarRelationFilter, LocationWhereInput> | null
    currentAlliance?: XOR<AllianceNullableScalarRelationFilter, AllianceWhereInput> | null
    battles?: BattleListRelationFilter
    state?: XOR<AgentStateNullableScalarRelationFilter, AgentStateWhereInput> | null
    strategy?: XOR<StrategyNullableScalarRelationFilter, StrategyWhereInput> | null
    cooldowns?: CooldownListRelationFilter
    alliedBy?: AllianceListRelationFilter
    battlesAsOpponent?: BattleListRelationFilter
    Tweet?: TweetListRelationFilter
  }, "id" | "agentId_gameId">

  export type AgentOrderByWithAggregationInput = {
    id?: SortOrder
    agentId?: SortOrder
    publicKey?: SortOrder
    agentProfileId?: SortOrder
    health?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    gameId?: SortOrder
    _count?: AgentCountOrderByAggregateInput
    _avg?: AgentAvgOrderByAggregateInput
    _max?: AgentMaxOrderByAggregateInput
    _min?: AgentMinOrderByAggregateInput
    _sum?: AgentSumOrderByAggregateInput
  }

  export type AgentScalarWhereWithAggregatesInput = {
    AND?: AgentScalarWhereWithAggregatesInput | AgentScalarWhereWithAggregatesInput[]
    OR?: AgentScalarWhereWithAggregatesInput[]
    NOT?: AgentScalarWhereWithAggregatesInput | AgentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Agent"> | string
    agentId?: IntWithAggregatesFilter<"Agent"> | number
    publicKey?: StringWithAggregatesFilter<"Agent"> | string
    agentProfileId?: StringWithAggregatesFilter<"Agent"> | string
    health?: IntWithAggregatesFilter<"Agent"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Agent"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Agent"> | Date | string
    gameId?: StringWithAggregatesFilter<"Agent"> | string
  }

  export type TweetWhereInput = {
    AND?: TweetWhereInput | TweetWhereInput[]
    OR?: TweetWhereInput[]
    NOT?: TweetWhereInput | TweetWhereInput[]
    id?: StringFilter<"Tweet"> | string
    agentId?: StringFilter<"Tweet"> | string
    content?: StringFilter<"Tweet"> | string
    type?: StringFilter<"Tweet"> | string
    timestamp?: DateTimeFilter<"Tweet"> | Date | string
    conversationId?: StringNullableFilter<"Tweet"> | string | null
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    interactions?: InteractionListRelationFilter
  }

  export type TweetOrderByWithRelationInput = {
    id?: SortOrder
    agentId?: SortOrder
    content?: SortOrder
    type?: SortOrder
    timestamp?: SortOrder
    conversationId?: SortOrderInput | SortOrder
    agent?: AgentOrderByWithRelationInput
    interactions?: InteractionOrderByRelationAggregateInput
  }

  export type TweetWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TweetWhereInput | TweetWhereInput[]
    OR?: TweetWhereInput[]
    NOT?: TweetWhereInput | TweetWhereInput[]
    agentId?: StringFilter<"Tweet"> | string
    content?: StringFilter<"Tweet"> | string
    type?: StringFilter<"Tweet"> | string
    timestamp?: DateTimeFilter<"Tweet"> | Date | string
    conversationId?: StringNullableFilter<"Tweet"> | string | null
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    interactions?: InteractionListRelationFilter
  }, "id">

  export type TweetOrderByWithAggregationInput = {
    id?: SortOrder
    agentId?: SortOrder
    content?: SortOrder
    type?: SortOrder
    timestamp?: SortOrder
    conversationId?: SortOrderInput | SortOrder
    _count?: TweetCountOrderByAggregateInput
    _max?: TweetMaxOrderByAggregateInput
    _min?: TweetMinOrderByAggregateInput
  }

  export type TweetScalarWhereWithAggregatesInput = {
    AND?: TweetScalarWhereWithAggregatesInput | TweetScalarWhereWithAggregatesInput[]
    OR?: TweetScalarWhereWithAggregatesInput[]
    NOT?: TweetScalarWhereWithAggregatesInput | TweetScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Tweet"> | string
    agentId?: StringWithAggregatesFilter<"Tweet"> | string
    content?: StringWithAggregatesFilter<"Tweet"> | string
    type?: StringWithAggregatesFilter<"Tweet"> | string
    timestamp?: DateTimeWithAggregatesFilter<"Tweet"> | Date | string
    conversationId?: StringNullableWithAggregatesFilter<"Tweet"> | string | null
  }

  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    id?: StringFilter<"Location"> | string
    x?: IntFilter<"Location"> | number
    y?: IntFilter<"Location"> | number
    terrainType?: EnumTerrainTypeFilter<"Location"> | $Enums.TerrainType
    agentId?: StringFilter<"Location"> | string
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }

  export type LocationOrderByWithRelationInput = {
    id?: SortOrder
    x?: SortOrder
    y?: SortOrder
    terrainType?: SortOrder
    agentId?: SortOrder
    agent?: AgentOrderByWithRelationInput
  }

  export type LocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    agentId?: string
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    x?: IntFilter<"Location"> | number
    y?: IntFilter<"Location"> | number
    terrainType?: EnumTerrainTypeFilter<"Location"> | $Enums.TerrainType
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }, "id" | "agentId">

  export type LocationOrderByWithAggregationInput = {
    id?: SortOrder
    x?: SortOrder
    y?: SortOrder
    terrainType?: SortOrder
    agentId?: SortOrder
    _count?: LocationCountOrderByAggregateInput
    _avg?: LocationAvgOrderByAggregateInput
    _max?: LocationMaxOrderByAggregateInput
    _min?: LocationMinOrderByAggregateInput
    _sum?: LocationSumOrderByAggregateInput
  }

  export type LocationScalarWhereWithAggregatesInput = {
    AND?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    OR?: LocationScalarWhereWithAggregatesInput[]
    NOT?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Location"> | string
    x?: IntWithAggregatesFilter<"Location"> | number
    y?: IntWithAggregatesFilter<"Location"> | number
    terrainType?: EnumTerrainTypeWithAggregatesFilter<"Location"> | $Enums.TerrainType
    agentId?: StringWithAggregatesFilter<"Location"> | string
  }

  export type AllianceWhereInput = {
    AND?: AllianceWhereInput | AllianceWhereInput[]
    OR?: AllianceWhereInput[]
    NOT?: AllianceWhereInput | AllianceWhereInput[]
    id?: StringFilter<"Alliance"> | string
    formedAt?: DateTimeFilter<"Alliance"> | Date | string
    combinedTokens?: FloatFilter<"Alliance"> | number
    status?: EnumAllianceStatusFilter<"Alliance"> | $Enums.AllianceStatus
    gameId?: StringFilter<"Alliance"> | string
    agentId?: StringFilter<"Alliance"> | string
    alliedAgentId?: StringFilter<"Alliance"> | string
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    alliedAgent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }

  export type AllianceOrderByWithRelationInput = {
    id?: SortOrder
    formedAt?: SortOrder
    combinedTokens?: SortOrder
    status?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    alliedAgentId?: SortOrder
    game?: GameOrderByWithRelationInput
    agent?: AgentOrderByWithRelationInput
    alliedAgent?: AgentOrderByWithRelationInput
  }

  export type AllianceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    agentId?: string
    AND?: AllianceWhereInput | AllianceWhereInput[]
    OR?: AllianceWhereInput[]
    NOT?: AllianceWhereInput | AllianceWhereInput[]
    formedAt?: DateTimeFilter<"Alliance"> | Date | string
    combinedTokens?: FloatFilter<"Alliance"> | number
    status?: EnumAllianceStatusFilter<"Alliance"> | $Enums.AllianceStatus
    gameId?: StringFilter<"Alliance"> | string
    alliedAgentId?: StringFilter<"Alliance"> | string
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    alliedAgent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }, "id" | "agentId">

  export type AllianceOrderByWithAggregationInput = {
    id?: SortOrder
    formedAt?: SortOrder
    combinedTokens?: SortOrder
    status?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    alliedAgentId?: SortOrder
    _count?: AllianceCountOrderByAggregateInput
    _avg?: AllianceAvgOrderByAggregateInput
    _max?: AllianceMaxOrderByAggregateInput
    _min?: AllianceMinOrderByAggregateInput
    _sum?: AllianceSumOrderByAggregateInput
  }

  export type AllianceScalarWhereWithAggregatesInput = {
    AND?: AllianceScalarWhereWithAggregatesInput | AllianceScalarWhereWithAggregatesInput[]
    OR?: AllianceScalarWhereWithAggregatesInput[]
    NOT?: AllianceScalarWhereWithAggregatesInput | AllianceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Alliance"> | string
    formedAt?: DateTimeWithAggregatesFilter<"Alliance"> | Date | string
    combinedTokens?: FloatWithAggregatesFilter<"Alliance"> | number
    status?: EnumAllianceStatusWithAggregatesFilter<"Alliance"> | $Enums.AllianceStatus
    gameId?: StringWithAggregatesFilter<"Alliance"> | string
    agentId?: StringWithAggregatesFilter<"Alliance"> | string
    alliedAgentId?: StringWithAggregatesFilter<"Alliance"> | string
  }

  export type BattleWhereInput = {
    AND?: BattleWhereInput | BattleWhereInput[]
    OR?: BattleWhereInput[]
    NOT?: BattleWhereInput | BattleWhereInput[]
    id?: StringFilter<"Battle"> | string
    timestamp?: DateTimeFilter<"Battle"> | Date | string
    outcome?: StringFilter<"Battle"> | string
    tokensLost?: FloatNullableFilter<"Battle"> | number | null
    tokensGained?: FloatNullableFilter<"Battle"> | number | null
    probability?: FloatFilter<"Battle"> | number
    gameId?: StringFilter<"Battle"> | string
    agentId?: StringFilter<"Battle"> | string
    opponentId?: StringFilter<"Battle"> | string
    type?: EnumBattleTypeFilter<"Battle"> | $Enums.BattleType
    status?: EnumBattleStatusFilter<"Battle"> | $Enums.BattleStatus
    startTime?: DateTimeFilter<"Battle"> | Date | string
    resolutionTime?: DateTimeFilter<"Battle"> | Date | string
    resolvedAt?: DateTimeNullableFilter<"Battle"> | Date | string | null
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    opponent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }

  export type BattleOrderByWithRelationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    outcome?: SortOrder
    tokensLost?: SortOrderInput | SortOrder
    tokensGained?: SortOrderInput | SortOrder
    probability?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    opponentId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    startTime?: SortOrder
    resolutionTime?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    game?: GameOrderByWithRelationInput
    agent?: AgentOrderByWithRelationInput
    opponent?: AgentOrderByWithRelationInput
  }

  export type BattleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BattleWhereInput | BattleWhereInput[]
    OR?: BattleWhereInput[]
    NOT?: BattleWhereInput | BattleWhereInput[]
    timestamp?: DateTimeFilter<"Battle"> | Date | string
    outcome?: StringFilter<"Battle"> | string
    tokensLost?: FloatNullableFilter<"Battle"> | number | null
    tokensGained?: FloatNullableFilter<"Battle"> | number | null
    probability?: FloatFilter<"Battle"> | number
    gameId?: StringFilter<"Battle"> | string
    agentId?: StringFilter<"Battle"> | string
    opponentId?: StringFilter<"Battle"> | string
    type?: EnumBattleTypeFilter<"Battle"> | $Enums.BattleType
    status?: EnumBattleStatusFilter<"Battle"> | $Enums.BattleStatus
    startTime?: DateTimeFilter<"Battle"> | Date | string
    resolutionTime?: DateTimeFilter<"Battle"> | Date | string
    resolvedAt?: DateTimeNullableFilter<"Battle"> | Date | string | null
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    opponent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }, "id">

  export type BattleOrderByWithAggregationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    outcome?: SortOrder
    tokensLost?: SortOrderInput | SortOrder
    tokensGained?: SortOrderInput | SortOrder
    probability?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    opponentId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    startTime?: SortOrder
    resolutionTime?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    _count?: BattleCountOrderByAggregateInput
    _avg?: BattleAvgOrderByAggregateInput
    _max?: BattleMaxOrderByAggregateInput
    _min?: BattleMinOrderByAggregateInput
    _sum?: BattleSumOrderByAggregateInput
  }

  export type BattleScalarWhereWithAggregatesInput = {
    AND?: BattleScalarWhereWithAggregatesInput | BattleScalarWhereWithAggregatesInput[]
    OR?: BattleScalarWhereWithAggregatesInput[]
    NOT?: BattleScalarWhereWithAggregatesInput | BattleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Battle"> | string
    timestamp?: DateTimeWithAggregatesFilter<"Battle"> | Date | string
    outcome?: StringWithAggregatesFilter<"Battle"> | string
    tokensLost?: FloatNullableWithAggregatesFilter<"Battle"> | number | null
    tokensGained?: FloatNullableWithAggregatesFilter<"Battle"> | number | null
    probability?: FloatWithAggregatesFilter<"Battle"> | number
    gameId?: StringWithAggregatesFilter<"Battle"> | string
    agentId?: StringWithAggregatesFilter<"Battle"> | string
    opponentId?: StringWithAggregatesFilter<"Battle"> | string
    type?: EnumBattleTypeWithAggregatesFilter<"Battle"> | $Enums.BattleType
    status?: EnumBattleStatusWithAggregatesFilter<"Battle"> | $Enums.BattleStatus
    startTime?: DateTimeWithAggregatesFilter<"Battle"> | Date | string
    resolutionTime?: DateTimeWithAggregatesFilter<"Battle"> | Date | string
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"Battle"> | Date | string | null
  }

  export type InteractionWhereInput = {
    AND?: InteractionWhereInput | InteractionWhereInput[]
    OR?: InteractionWhereInput[]
    NOT?: InteractionWhereInput | InteractionWhereInput[]
    id?: StringFilter<"Interaction"> | string
    tweetId?: StringFilter<"Interaction"> | string
    userId?: StringFilter<"Interaction"> | string
    type?: StringFilter<"Interaction"> | string
    content?: StringNullableFilter<"Interaction"> | string | null
    timestamp?: DateTimeFilter<"Interaction"> | Date | string
    userMetrics?: JsonFilter<"Interaction">
    tweet?: XOR<TweetScalarRelationFilter, TweetWhereInput>
  }

  export type InteractionOrderByWithRelationInput = {
    id?: SortOrder
    tweetId?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    content?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    userMetrics?: SortOrder
    tweet?: TweetOrderByWithRelationInput
  }

  export type InteractionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InteractionWhereInput | InteractionWhereInput[]
    OR?: InteractionWhereInput[]
    NOT?: InteractionWhereInput | InteractionWhereInput[]
    tweetId?: StringFilter<"Interaction"> | string
    userId?: StringFilter<"Interaction"> | string
    type?: StringFilter<"Interaction"> | string
    content?: StringNullableFilter<"Interaction"> | string | null
    timestamp?: DateTimeFilter<"Interaction"> | Date | string
    userMetrics?: JsonFilter<"Interaction">
    tweet?: XOR<TweetScalarRelationFilter, TweetWhereInput>
  }, "id">

  export type InteractionOrderByWithAggregationInput = {
    id?: SortOrder
    tweetId?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    content?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    userMetrics?: SortOrder
    _count?: InteractionCountOrderByAggregateInput
    _max?: InteractionMaxOrderByAggregateInput
    _min?: InteractionMinOrderByAggregateInput
  }

  export type InteractionScalarWhereWithAggregatesInput = {
    AND?: InteractionScalarWhereWithAggregatesInput | InteractionScalarWhereWithAggregatesInput[]
    OR?: InteractionScalarWhereWithAggregatesInput[]
    NOT?: InteractionScalarWhereWithAggregatesInput | InteractionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Interaction"> | string
    tweetId?: StringWithAggregatesFilter<"Interaction"> | string
    userId?: StringWithAggregatesFilter<"Interaction"> | string
    type?: StringWithAggregatesFilter<"Interaction"> | string
    content?: StringNullableWithAggregatesFilter<"Interaction"> | string | null
    timestamp?: DateTimeWithAggregatesFilter<"Interaction"> | Date | string
    userMetrics?: JsonWithAggregatesFilter<"Interaction">
  }

  export type AgentStateWhereInput = {
    AND?: AgentStateWhereInput | AgentStateWhereInput[]
    OR?: AgentStateWhereInput[]
    NOT?: AgentStateWhereInput | AgentStateWhereInput[]
    id?: StringFilter<"AgentState"> | string
    isAlive?: BoolFilter<"AgentState"> | boolean
    lastActionType?: StringFilter<"AgentState"> | string
    lastActionTime?: DateTimeFilter<"AgentState"> | Date | string
    lastActionDetails?: StringFilter<"AgentState"> | string
    influencedByTweet?: StringNullableFilter<"AgentState"> | string | null
    influenceScore?: FloatFilter<"AgentState"> | number
    agentId?: StringFilter<"AgentState"> | string
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }

  export type AgentStateOrderByWithRelationInput = {
    id?: SortOrder
    isAlive?: SortOrder
    lastActionType?: SortOrder
    lastActionTime?: SortOrder
    lastActionDetails?: SortOrder
    influencedByTweet?: SortOrderInput | SortOrder
    influenceScore?: SortOrder
    agentId?: SortOrder
    agent?: AgentOrderByWithRelationInput
  }

  export type AgentStateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    agentId?: string
    AND?: AgentStateWhereInput | AgentStateWhereInput[]
    OR?: AgentStateWhereInput[]
    NOT?: AgentStateWhereInput | AgentStateWhereInput[]
    isAlive?: BoolFilter<"AgentState"> | boolean
    lastActionType?: StringFilter<"AgentState"> | string
    lastActionTime?: DateTimeFilter<"AgentState"> | Date | string
    lastActionDetails?: StringFilter<"AgentState"> | string
    influencedByTweet?: StringNullableFilter<"AgentState"> | string | null
    influenceScore?: FloatFilter<"AgentState"> | number
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }, "id" | "agentId">

  export type AgentStateOrderByWithAggregationInput = {
    id?: SortOrder
    isAlive?: SortOrder
    lastActionType?: SortOrder
    lastActionTime?: SortOrder
    lastActionDetails?: SortOrder
    influencedByTweet?: SortOrderInput | SortOrder
    influenceScore?: SortOrder
    agentId?: SortOrder
    _count?: AgentStateCountOrderByAggregateInput
    _avg?: AgentStateAvgOrderByAggregateInput
    _max?: AgentStateMaxOrderByAggregateInput
    _min?: AgentStateMinOrderByAggregateInput
    _sum?: AgentStateSumOrderByAggregateInput
  }

  export type AgentStateScalarWhereWithAggregatesInput = {
    AND?: AgentStateScalarWhereWithAggregatesInput | AgentStateScalarWhereWithAggregatesInput[]
    OR?: AgentStateScalarWhereWithAggregatesInput[]
    NOT?: AgentStateScalarWhereWithAggregatesInput | AgentStateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AgentState"> | string
    isAlive?: BoolWithAggregatesFilter<"AgentState"> | boolean
    lastActionType?: StringWithAggregatesFilter<"AgentState"> | string
    lastActionTime?: DateTimeWithAggregatesFilter<"AgentState"> | Date | string
    lastActionDetails?: StringWithAggregatesFilter<"AgentState"> | string
    influencedByTweet?: StringNullableWithAggregatesFilter<"AgentState"> | string | null
    influenceScore?: FloatWithAggregatesFilter<"AgentState"> | number
    agentId?: StringWithAggregatesFilter<"AgentState"> | string
  }

  export type CooldownWhereInput = {
    AND?: CooldownWhereInput | CooldownWhereInput[]
    OR?: CooldownWhereInput[]
    NOT?: CooldownWhereInput | CooldownWhereInput[]
    id?: StringFilter<"Cooldown"> | string
    type?: EnumCooldownTypeFilter<"Cooldown"> | $Enums.CooldownType
    endsAt?: DateTimeFilter<"Cooldown"> | Date | string
    agentId?: StringFilter<"Cooldown"> | string
    targetAgentId?: StringNullableFilter<"Cooldown"> | string | null
    gameId?: StringFilter<"Cooldown"> | string
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
  }

  export type CooldownOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    endsAt?: SortOrder
    agentId?: SortOrder
    targetAgentId?: SortOrderInput | SortOrder
    gameId?: SortOrder
    agent?: AgentOrderByWithRelationInput
    game?: GameOrderByWithRelationInput
  }

  export type CooldownWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    agentId_type?: CooldownAgentIdTypeCompoundUniqueInput
    AND?: CooldownWhereInput | CooldownWhereInput[]
    OR?: CooldownWhereInput[]
    NOT?: CooldownWhereInput | CooldownWhereInput[]
    type?: EnumCooldownTypeFilter<"Cooldown"> | $Enums.CooldownType
    endsAt?: DateTimeFilter<"Cooldown"> | Date | string
    agentId?: StringFilter<"Cooldown"> | string
    targetAgentId?: StringNullableFilter<"Cooldown"> | string | null
    gameId?: StringFilter<"Cooldown"> | string
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
  }, "id" | "agentId_type">

  export type CooldownOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    endsAt?: SortOrder
    agentId?: SortOrder
    targetAgentId?: SortOrderInput | SortOrder
    gameId?: SortOrder
    _count?: CooldownCountOrderByAggregateInput
    _max?: CooldownMaxOrderByAggregateInput
    _min?: CooldownMinOrderByAggregateInput
  }

  export type CooldownScalarWhereWithAggregatesInput = {
    AND?: CooldownScalarWhereWithAggregatesInput | CooldownScalarWhereWithAggregatesInput[]
    OR?: CooldownScalarWhereWithAggregatesInput[]
    NOT?: CooldownScalarWhereWithAggregatesInput | CooldownScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Cooldown"> | string
    type?: EnumCooldownTypeWithAggregatesFilter<"Cooldown"> | $Enums.CooldownType
    endsAt?: DateTimeWithAggregatesFilter<"Cooldown"> | Date | string
    agentId?: StringWithAggregatesFilter<"Cooldown"> | string
    targetAgentId?: StringNullableWithAggregatesFilter<"Cooldown"> | string | null
    gameId?: StringWithAggregatesFilter<"Cooldown"> | string
  }

  export type StrategyWhereInput = {
    AND?: StrategyWhereInput | StrategyWhereInput[]
    OR?: StrategyWhereInput[]
    NOT?: StrategyWhereInput | StrategyWhereInput[]
    id?: StringFilter<"Strategy"> | string
    publicStrategy?: StringFilter<"Strategy"> | string
    actualStrategy?: StringFilter<"Strategy"> | string
    deceptionLevel?: IntFilter<"Strategy"> | number
    agentId?: StringFilter<"Strategy"> | string
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }

  export type StrategyOrderByWithRelationInput = {
    id?: SortOrder
    publicStrategy?: SortOrder
    actualStrategy?: SortOrder
    deceptionLevel?: SortOrder
    agentId?: SortOrder
    agent?: AgentOrderByWithRelationInput
  }

  export type StrategyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    agentId?: string
    AND?: StrategyWhereInput | StrategyWhereInput[]
    OR?: StrategyWhereInput[]
    NOT?: StrategyWhereInput | StrategyWhereInput[]
    publicStrategy?: StringFilter<"Strategy"> | string
    actualStrategy?: StringFilter<"Strategy"> | string
    deceptionLevel?: IntFilter<"Strategy"> | number
    agent?: XOR<AgentScalarRelationFilter, AgentWhereInput>
  }, "id" | "agentId">

  export type StrategyOrderByWithAggregationInput = {
    id?: SortOrder
    publicStrategy?: SortOrder
    actualStrategy?: SortOrder
    deceptionLevel?: SortOrder
    agentId?: SortOrder
    _count?: StrategyCountOrderByAggregateInput
    _avg?: StrategyAvgOrderByAggregateInput
    _max?: StrategyMaxOrderByAggregateInput
    _min?: StrategyMinOrderByAggregateInput
    _sum?: StrategySumOrderByAggregateInput
  }

  export type StrategyScalarWhereWithAggregatesInput = {
    AND?: StrategyScalarWhereWithAggregatesInput | StrategyScalarWhereWithAggregatesInput[]
    OR?: StrategyScalarWhereWithAggregatesInput[]
    NOT?: StrategyScalarWhereWithAggregatesInput | StrategyScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Strategy"> | string
    publicStrategy?: StringWithAggregatesFilter<"Strategy"> | string
    actualStrategy?: StringWithAggregatesFilter<"Strategy"> | string
    deceptionLevel?: IntWithAggregatesFilter<"Strategy"> | number
    agentId?: StringWithAggregatesFilter<"Strategy"> | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    privyUserId?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    email?: StringNullableFilter<"User"> | string | null
    walletAddress?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    email?: SortOrderInput | SortOrder
    walletAddress?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    privyUserId?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    walletAddress?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }, "id" | "privyUserId" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    email?: SortOrderInput | SortOrder
    walletAddress?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    privyUserId?: StringWithAggregatesFilter<"User"> | string
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
    email?: StringNullableWithAggregatesFilter<"User"> | string | null
    walletAddress?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type GameCreateInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentCreateNestedManyWithoutGameInput
    alliances?: AllianceCreateNestedManyWithoutGameInput
    battles?: BattleCreateNestedManyWithoutGameInput
    Cooldown?: CooldownCreateNestedManyWithoutGameInput
  }

  export type GameUncheckedCreateInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentUncheckedCreateNestedManyWithoutGameInput
    alliances?: AllianceUncheckedCreateNestedManyWithoutGameInput
    battles?: BattleUncheckedCreateNestedManyWithoutGameInput
    Cooldown?: CooldownUncheckedCreateNestedManyWithoutGameInput
  }

  export type GameUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUpdateManyWithoutGameNestedInput
    alliances?: AllianceUpdateManyWithoutGameNestedInput
    battles?: BattleUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUncheckedUpdateManyWithoutGameNestedInput
    alliances?: AllianceUncheckedUpdateManyWithoutGameNestedInput
    battles?: BattleUncheckedUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUncheckedUpdateManyWithoutGameNestedInput
  }

  export type GameCreateManyInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentProfileCreateInput = {
    id?: string
    onchainId: number
    name: string
    xHandle: string
    bio?: AgentProfileCreatebioInput | string[]
    lore?: AgentProfileCreateloreInput | string[]
    characteristics?: AgentProfileCreatecharacteristicsInput | string[]
    knowledge?: AgentProfileCreateknowledgeInput | string[]
    traits: JsonNullValueInput | InputJsonValue
    agent?: AgentCreateNestedManyWithoutAgentProfileInput
  }

  export type AgentProfileUncheckedCreateInput = {
    id?: string
    onchainId: number
    name: string
    xHandle: string
    bio?: AgentProfileCreatebioInput | string[]
    lore?: AgentProfileCreateloreInput | string[]
    characteristics?: AgentProfileCreatecharacteristicsInput | string[]
    knowledge?: AgentProfileCreateknowledgeInput | string[]
    traits: JsonNullValueInput | InputJsonValue
    agent?: AgentUncheckedCreateNestedManyWithoutAgentProfileInput
  }

  export type AgentProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    onchainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    xHandle?: StringFieldUpdateOperationsInput | string
    bio?: AgentProfileUpdatebioInput | string[]
    lore?: AgentProfileUpdateloreInput | string[]
    characteristics?: AgentProfileUpdatecharacteristicsInput | string[]
    knowledge?: AgentProfileUpdateknowledgeInput | string[]
    traits?: JsonNullValueInput | InputJsonValue
    agent?: AgentUpdateManyWithoutAgentProfileNestedInput
  }

  export type AgentProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    onchainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    xHandle?: StringFieldUpdateOperationsInput | string
    bio?: AgentProfileUpdatebioInput | string[]
    lore?: AgentProfileUpdateloreInput | string[]
    characteristics?: AgentProfileUpdatecharacteristicsInput | string[]
    knowledge?: AgentProfileUpdateknowledgeInput | string[]
    traits?: JsonNullValueInput | InputJsonValue
    agent?: AgentUncheckedUpdateManyWithoutAgentProfileNestedInput
  }

  export type AgentProfileCreateManyInput = {
    id?: string
    onchainId: number
    name: string
    xHandle: string
    bio?: AgentProfileCreatebioInput | string[]
    lore?: AgentProfileCreateloreInput | string[]
    characteristics?: AgentProfileCreatecharacteristicsInput | string[]
    knowledge?: AgentProfileCreateknowledgeInput | string[]
    traits: JsonNullValueInput | InputJsonValue
  }

  export type AgentProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    onchainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    xHandle?: StringFieldUpdateOperationsInput | string
    bio?: AgentProfileUpdatebioInput | string[]
    lore?: AgentProfileUpdateloreInput | string[]
    characteristics?: AgentProfileUpdatecharacteristicsInput | string[]
    knowledge?: AgentProfileUpdateknowledgeInput | string[]
    traits?: JsonNullValueInput | InputJsonValue
  }

  export type AgentProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    onchainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    xHandle?: StringFieldUpdateOperationsInput | string
    bio?: AgentProfileUpdatebioInput | string[]
    lore?: AgentProfileUpdateloreInput | string[]
    characteristics?: AgentProfileUpdatecharacteristicsInput | string[]
    knowledge?: AgentProfileUpdateknowledgeInput | string[]
    traits?: JsonNullValueInput | InputJsonValue
  }

  export type AgentCreateInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentCreateManyInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
  }

  export type AgentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
  }

  export type TweetCreateInput = {
    id?: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
    agent: AgentCreateNestedOneWithoutTweetInput
    interactions?: InteractionCreateNestedManyWithoutTweetInput
  }

  export type TweetUncheckedCreateInput = {
    id?: string
    agentId: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
    interactions?: InteractionUncheckedCreateNestedManyWithoutTweetInput
  }

  export type TweetUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    agent?: AgentUpdateOneRequiredWithoutTweetNestedInput
    interactions?: InteractionUpdateManyWithoutTweetNestedInput
  }

  export type TweetUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    interactions?: InteractionUncheckedUpdateManyWithoutTweetNestedInput
  }

  export type TweetCreateManyInput = {
    id?: string
    agentId: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
  }

  export type TweetUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TweetUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LocationCreateInput = {
    id?: string
    x: number
    y: number
    terrainType: $Enums.TerrainType
    agent: AgentCreateNestedOneWithoutLocationInput
  }

  export type LocationUncheckedCreateInput = {
    id?: string
    x: number
    y: number
    terrainType: $Enums.TerrainType
    agentId: string
  }

  export type LocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    x?: IntFieldUpdateOperationsInput | number
    y?: IntFieldUpdateOperationsInput | number
    terrainType?: EnumTerrainTypeFieldUpdateOperationsInput | $Enums.TerrainType
    agent?: AgentUpdateOneRequiredWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    x?: IntFieldUpdateOperationsInput | number
    y?: IntFieldUpdateOperationsInput | number
    terrainType?: EnumTerrainTypeFieldUpdateOperationsInput | $Enums.TerrainType
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type LocationCreateManyInput = {
    id?: string
    x: number
    y: number
    terrainType: $Enums.TerrainType
    agentId: string
  }

  export type LocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    x?: IntFieldUpdateOperationsInput | number
    y?: IntFieldUpdateOperationsInput | number
    terrainType?: EnumTerrainTypeFieldUpdateOperationsInput | $Enums.TerrainType
  }

  export type LocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    x?: IntFieldUpdateOperationsInput | number
    y?: IntFieldUpdateOperationsInput | number
    terrainType?: EnumTerrainTypeFieldUpdateOperationsInput | $Enums.TerrainType
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type AllianceCreateInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    game: GameCreateNestedOneWithoutAlliancesInput
    agent: AgentCreateNestedOneWithoutCurrentAllianceInput
    alliedAgent: AgentCreateNestedOneWithoutAlliedByInput
  }

  export type AllianceUncheckedCreateInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    gameId: string
    agentId: string
    alliedAgentId: string
  }

  export type AllianceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    game?: GameUpdateOneRequiredWithoutAlliancesNestedInput
    agent?: AgentUpdateOneRequiredWithoutCurrentAllianceNestedInput
    alliedAgent?: AgentUpdateOneRequiredWithoutAlliedByNestedInput
  }

  export type AllianceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    alliedAgentId?: StringFieldUpdateOperationsInput | string
  }

  export type AllianceCreateManyInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    gameId: string
    agentId: string
    alliedAgentId: string
  }

  export type AllianceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
  }

  export type AllianceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    alliedAgentId?: StringFieldUpdateOperationsInput | string
  }

  export type BattleCreateInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
    game: GameCreateNestedOneWithoutBattlesInput
    agent: AgentCreateNestedOneWithoutBattlesInput
    opponent: AgentCreateNestedOneWithoutBattlesAsOpponentInput
  }

  export type BattleUncheckedCreateInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    gameId: string
    agentId: string
    opponentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type BattleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    game?: GameUpdateOneRequiredWithoutBattlesNestedInput
    agent?: AgentUpdateOneRequiredWithoutBattlesNestedInput
    opponent?: AgentUpdateOneRequiredWithoutBattlesAsOpponentNestedInput
  }

  export type BattleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    opponentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BattleCreateManyInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    gameId: string
    agentId: string
    opponentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type BattleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BattleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    opponentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type InteractionCreateInput = {
    id?: string
    userId: string
    type: string
    content?: string | null
    timestamp: Date | string
    userMetrics: JsonNullValueInput | InputJsonValue
    tweet: TweetCreateNestedOneWithoutInteractionsInput
  }

  export type InteractionUncheckedCreateInput = {
    id?: string
    tweetId: string
    userId: string
    type: string
    content?: string | null
    timestamp: Date | string
    userMetrics: JsonNullValueInput | InputJsonValue
  }

  export type InteractionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    userMetrics?: JsonNullValueInput | InputJsonValue
    tweet?: TweetUpdateOneRequiredWithoutInteractionsNestedInput
  }

  export type InteractionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tweetId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    userMetrics?: JsonNullValueInput | InputJsonValue
  }

  export type InteractionCreateManyInput = {
    id?: string
    tweetId: string
    userId: string
    type: string
    content?: string | null
    timestamp: Date | string
    userMetrics: JsonNullValueInput | InputJsonValue
  }

  export type InteractionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    userMetrics?: JsonNullValueInput | InputJsonValue
  }

  export type InteractionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tweetId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    userMetrics?: JsonNullValueInput | InputJsonValue
  }

  export type AgentStateCreateInput = {
    id?: string
    isAlive?: boolean
    lastActionType: string
    lastActionTime?: Date | string
    lastActionDetails: string
    influencedByTweet?: string | null
    influenceScore?: number
    agent: AgentCreateNestedOneWithoutStateInput
  }

  export type AgentStateUncheckedCreateInput = {
    id?: string
    isAlive?: boolean
    lastActionType: string
    lastActionTime?: Date | string
    lastActionDetails: string
    influencedByTweet?: string | null
    influenceScore?: number
    agentId: string
  }

  export type AgentStateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    isAlive?: BoolFieldUpdateOperationsInput | boolean
    lastActionType?: StringFieldUpdateOperationsInput | string
    lastActionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActionDetails?: StringFieldUpdateOperationsInput | string
    influencedByTweet?: NullableStringFieldUpdateOperationsInput | string | null
    influenceScore?: FloatFieldUpdateOperationsInput | number
    agent?: AgentUpdateOneRequiredWithoutStateNestedInput
  }

  export type AgentStateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    isAlive?: BoolFieldUpdateOperationsInput | boolean
    lastActionType?: StringFieldUpdateOperationsInput | string
    lastActionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActionDetails?: StringFieldUpdateOperationsInput | string
    influencedByTweet?: NullableStringFieldUpdateOperationsInput | string | null
    influenceScore?: FloatFieldUpdateOperationsInput | number
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type AgentStateCreateManyInput = {
    id?: string
    isAlive?: boolean
    lastActionType: string
    lastActionTime?: Date | string
    lastActionDetails: string
    influencedByTweet?: string | null
    influenceScore?: number
    agentId: string
  }

  export type AgentStateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    isAlive?: BoolFieldUpdateOperationsInput | boolean
    lastActionType?: StringFieldUpdateOperationsInput | string
    lastActionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActionDetails?: StringFieldUpdateOperationsInput | string
    influencedByTweet?: NullableStringFieldUpdateOperationsInput | string | null
    influenceScore?: FloatFieldUpdateOperationsInput | number
  }

  export type AgentStateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    isAlive?: BoolFieldUpdateOperationsInput | boolean
    lastActionType?: StringFieldUpdateOperationsInput | string
    lastActionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActionDetails?: StringFieldUpdateOperationsInput | string
    influencedByTweet?: NullableStringFieldUpdateOperationsInput | string | null
    influenceScore?: FloatFieldUpdateOperationsInput | number
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type CooldownCreateInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    targetAgentId?: string | null
    agent: AgentCreateNestedOneWithoutCooldownsInput
    game: GameCreateNestedOneWithoutCooldownInput
  }

  export type CooldownUncheckedCreateInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    agentId: string
    targetAgentId?: string | null
    gameId: string
  }

  export type CooldownUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    agent?: AgentUpdateOneRequiredWithoutCooldownsNestedInput
    game?: GameUpdateOneRequiredWithoutCooldownNestedInput
  }

  export type CooldownUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentId?: StringFieldUpdateOperationsInput | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    gameId?: StringFieldUpdateOperationsInput | string
  }

  export type CooldownCreateManyInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    agentId: string
    targetAgentId?: string | null
    gameId: string
  }

  export type CooldownUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CooldownUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentId?: StringFieldUpdateOperationsInput | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    gameId?: StringFieldUpdateOperationsInput | string
  }

  export type StrategyCreateInput = {
    id?: string
    publicStrategy: string
    actualStrategy: string
    deceptionLevel: number
    agent: AgentCreateNestedOneWithoutStrategyInput
  }

  export type StrategyUncheckedCreateInput = {
    id?: string
    publicStrategy: string
    actualStrategy: string
    deceptionLevel: number
    agentId: string
  }

  export type StrategyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    publicStrategy?: StringFieldUpdateOperationsInput | string
    actualStrategy?: StringFieldUpdateOperationsInput | string
    deceptionLevel?: IntFieldUpdateOperationsInput | number
    agent?: AgentUpdateOneRequiredWithoutStrategyNestedInput
  }

  export type StrategyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    publicStrategy?: StringFieldUpdateOperationsInput | string
    actualStrategy?: StringFieldUpdateOperationsInput | string
    deceptionLevel?: IntFieldUpdateOperationsInput | number
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type StrategyCreateManyInput = {
    id?: string
    publicStrategy: string
    actualStrategy: string
    deceptionLevel: number
    agentId: string
  }

  export type StrategyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    publicStrategy?: StringFieldUpdateOperationsInput | string
    actualStrategy?: StringFieldUpdateOperationsInput | string
    deceptionLevel?: IntFieldUpdateOperationsInput | number
  }

  export type StrategyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    publicStrategy?: StringFieldUpdateOperationsInput | string
    actualStrategy?: StringFieldUpdateOperationsInput | string
    deceptionLevel?: IntFieldUpdateOperationsInput | number
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateInput = {
    id: string
    privyUserId: string
    role?: $Enums.UserRole
    email?: string | null
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUncheckedCreateInput = {
    id: string
    privyUserId: string
    role?: $Enums.UserRole
    email?: string | null
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    email?: NullableStringFieldUpdateOperationsInput | string | null
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    email?: NullableStringFieldUpdateOperationsInput | string | null
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateManyInput = {
    id: string
    privyUserId: string
    role?: $Enums.UserRole
    email?: string | null
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    email?: NullableStringFieldUpdateOperationsInput | string | null
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    email?: NullableStringFieldUpdateOperationsInput | string | null
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type AgentListRelationFilter = {
    every?: AgentWhereInput
    some?: AgentWhereInput
    none?: AgentWhereInput
  }

  export type AllianceListRelationFilter = {
    every?: AllianceWhereInput
    some?: AllianceWhereInput
    none?: AllianceWhereInput
  }

  export type BattleListRelationFilter = {
    every?: BattleWhereInput
    some?: BattleWhereInput
    none?: BattleWhereInput
  }

  export type CooldownListRelationFilter = {
    every?: CooldownWhereInput
    some?: CooldownWhereInput
    none?: CooldownWhereInput
  }

  export type AgentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AllianceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BattleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CooldownOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GameCountOrderByAggregateInput = {
    id?: SortOrder
    gameId?: SortOrder
    authority?: SortOrder
    tokenMint?: SortOrder
    rewardsVault?: SortOrder
    mapDiameter?: SortOrder
    isActive?: SortOrder
    lastUpdate?: SortOrder
    bump?: SortOrder
    dailyRewardTokens?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GameAvgOrderByAggregateInput = {
    gameId?: SortOrder
    mapDiameter?: SortOrder
    bump?: SortOrder
    dailyRewardTokens?: SortOrder
  }

  export type GameMaxOrderByAggregateInput = {
    id?: SortOrder
    gameId?: SortOrder
    authority?: SortOrder
    tokenMint?: SortOrder
    rewardsVault?: SortOrder
    mapDiameter?: SortOrder
    isActive?: SortOrder
    lastUpdate?: SortOrder
    bump?: SortOrder
    dailyRewardTokens?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GameMinOrderByAggregateInput = {
    id?: SortOrder
    gameId?: SortOrder
    authority?: SortOrder
    tokenMint?: SortOrder
    rewardsVault?: SortOrder
    mapDiameter?: SortOrder
    isActive?: SortOrder
    lastUpdate?: SortOrder
    bump?: SortOrder
    dailyRewardTokens?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GameSumOrderByAggregateInput = {
    gameId?: SortOrder
    mapDiameter?: SortOrder
    bump?: SortOrder
    dailyRewardTokens?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AgentProfileCountOrderByAggregateInput = {
    id?: SortOrder
    onchainId?: SortOrder
    name?: SortOrder
    xHandle?: SortOrder
    bio?: SortOrder
    lore?: SortOrder
    characteristics?: SortOrder
    knowledge?: SortOrder
    traits?: SortOrder
  }

  export type AgentProfileAvgOrderByAggregateInput = {
    onchainId?: SortOrder
  }

  export type AgentProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    onchainId?: SortOrder
    name?: SortOrder
    xHandle?: SortOrder
  }

  export type AgentProfileMinOrderByAggregateInput = {
    id?: SortOrder
    onchainId?: SortOrder
    name?: SortOrder
    xHandle?: SortOrder
  }

  export type AgentProfileSumOrderByAggregateInput = {
    onchainId?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type AgentProfileScalarRelationFilter = {
    is?: AgentProfileWhereInput
    isNot?: AgentProfileWhereInput
  }

  export type GameScalarRelationFilter = {
    is?: GameWhereInput
    isNot?: GameWhereInput
  }

  export type LocationNullableScalarRelationFilter = {
    is?: LocationWhereInput | null
    isNot?: LocationWhereInput | null
  }

  export type AllianceNullableScalarRelationFilter = {
    is?: AllianceWhereInput | null
    isNot?: AllianceWhereInput | null
  }

  export type AgentStateNullableScalarRelationFilter = {
    is?: AgentStateWhereInput | null
    isNot?: AgentStateWhereInput | null
  }

  export type StrategyNullableScalarRelationFilter = {
    is?: StrategyWhereInput | null
    isNot?: StrategyWhereInput | null
  }

  export type TweetListRelationFilter = {
    every?: TweetWhereInput
    some?: TweetWhereInput
    none?: TweetWhereInput
  }

  export type TweetOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AgentAgentIdGameIdCompoundUniqueInput = {
    agentId: number
    gameId: string
  }

  export type AgentCountOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    publicKey?: SortOrder
    agentProfileId?: SortOrder
    health?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    gameId?: SortOrder
  }

  export type AgentAvgOrderByAggregateInput = {
    agentId?: SortOrder
    health?: SortOrder
  }

  export type AgentMaxOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    publicKey?: SortOrder
    agentProfileId?: SortOrder
    health?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    gameId?: SortOrder
  }

  export type AgentMinOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    publicKey?: SortOrder
    agentProfileId?: SortOrder
    health?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    gameId?: SortOrder
  }

  export type AgentSumOrderByAggregateInput = {
    agentId?: SortOrder
    health?: SortOrder
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type AgentScalarRelationFilter = {
    is?: AgentWhereInput
    isNot?: AgentWhereInput
  }

  export type InteractionListRelationFilter = {
    every?: InteractionWhereInput
    some?: InteractionWhereInput
    none?: InteractionWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type InteractionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TweetCountOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    content?: SortOrder
    type?: SortOrder
    timestamp?: SortOrder
    conversationId?: SortOrder
  }

  export type TweetMaxOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    content?: SortOrder
    type?: SortOrder
    timestamp?: SortOrder
    conversationId?: SortOrder
  }

  export type TweetMinOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    content?: SortOrder
    type?: SortOrder
    timestamp?: SortOrder
    conversationId?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumTerrainTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TerrainType | EnumTerrainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTerrainTypeFilter<$PrismaModel> | $Enums.TerrainType
  }

  export type LocationCountOrderByAggregateInput = {
    id?: SortOrder
    x?: SortOrder
    y?: SortOrder
    terrainType?: SortOrder
    agentId?: SortOrder
  }

  export type LocationAvgOrderByAggregateInput = {
    x?: SortOrder
    y?: SortOrder
  }

  export type LocationMaxOrderByAggregateInput = {
    id?: SortOrder
    x?: SortOrder
    y?: SortOrder
    terrainType?: SortOrder
    agentId?: SortOrder
  }

  export type LocationMinOrderByAggregateInput = {
    id?: SortOrder
    x?: SortOrder
    y?: SortOrder
    terrainType?: SortOrder
    agentId?: SortOrder
  }

  export type LocationSumOrderByAggregateInput = {
    x?: SortOrder
    y?: SortOrder
  }

  export type EnumTerrainTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TerrainType | EnumTerrainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTerrainTypeWithAggregatesFilter<$PrismaModel> | $Enums.TerrainType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTerrainTypeFilter<$PrismaModel>
    _max?: NestedEnumTerrainTypeFilter<$PrismaModel>
  }

  export type EnumAllianceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AllianceStatus | EnumAllianceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAllianceStatusFilter<$PrismaModel> | $Enums.AllianceStatus
  }

  export type AllianceCountOrderByAggregateInput = {
    id?: SortOrder
    formedAt?: SortOrder
    combinedTokens?: SortOrder
    status?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    alliedAgentId?: SortOrder
  }

  export type AllianceAvgOrderByAggregateInput = {
    combinedTokens?: SortOrder
  }

  export type AllianceMaxOrderByAggregateInput = {
    id?: SortOrder
    formedAt?: SortOrder
    combinedTokens?: SortOrder
    status?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    alliedAgentId?: SortOrder
  }

  export type AllianceMinOrderByAggregateInput = {
    id?: SortOrder
    formedAt?: SortOrder
    combinedTokens?: SortOrder
    status?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    alliedAgentId?: SortOrder
  }

  export type AllianceSumOrderByAggregateInput = {
    combinedTokens?: SortOrder
  }

  export type EnumAllianceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AllianceStatus | EnumAllianceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAllianceStatusWithAggregatesFilter<$PrismaModel> | $Enums.AllianceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAllianceStatusFilter<$PrismaModel>
    _max?: NestedEnumAllianceStatusFilter<$PrismaModel>
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type EnumBattleTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleType | EnumBattleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleTypeFilter<$PrismaModel> | $Enums.BattleType
  }

  export type EnumBattleStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleStatus | EnumBattleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleStatusFilter<$PrismaModel> | $Enums.BattleStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BattleCountOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    outcome?: SortOrder
    tokensLost?: SortOrder
    tokensGained?: SortOrder
    probability?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    opponentId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    startTime?: SortOrder
    resolutionTime?: SortOrder
    resolvedAt?: SortOrder
  }

  export type BattleAvgOrderByAggregateInput = {
    tokensLost?: SortOrder
    tokensGained?: SortOrder
    probability?: SortOrder
  }

  export type BattleMaxOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    outcome?: SortOrder
    tokensLost?: SortOrder
    tokensGained?: SortOrder
    probability?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    opponentId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    startTime?: SortOrder
    resolutionTime?: SortOrder
    resolvedAt?: SortOrder
  }

  export type BattleMinOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    outcome?: SortOrder
    tokensLost?: SortOrder
    tokensGained?: SortOrder
    probability?: SortOrder
    gameId?: SortOrder
    agentId?: SortOrder
    opponentId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    startTime?: SortOrder
    resolutionTime?: SortOrder
    resolvedAt?: SortOrder
  }

  export type BattleSumOrderByAggregateInput = {
    tokensLost?: SortOrder
    tokensGained?: SortOrder
    probability?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type EnumBattleTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleType | EnumBattleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleTypeWithAggregatesFilter<$PrismaModel> | $Enums.BattleType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBattleTypeFilter<$PrismaModel>
    _max?: NestedEnumBattleTypeFilter<$PrismaModel>
  }

  export type EnumBattleStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleStatus | EnumBattleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleStatusWithAggregatesFilter<$PrismaModel> | $Enums.BattleStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBattleStatusFilter<$PrismaModel>
    _max?: NestedEnumBattleStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type TweetScalarRelationFilter = {
    is?: TweetWhereInput
    isNot?: TweetWhereInput
  }

  export type InteractionCountOrderByAggregateInput = {
    id?: SortOrder
    tweetId?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    content?: SortOrder
    timestamp?: SortOrder
    userMetrics?: SortOrder
  }

  export type InteractionMaxOrderByAggregateInput = {
    id?: SortOrder
    tweetId?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    content?: SortOrder
    timestamp?: SortOrder
  }

  export type InteractionMinOrderByAggregateInput = {
    id?: SortOrder
    tweetId?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    content?: SortOrder
    timestamp?: SortOrder
  }

  export type AgentStateCountOrderByAggregateInput = {
    id?: SortOrder
    isAlive?: SortOrder
    lastActionType?: SortOrder
    lastActionTime?: SortOrder
    lastActionDetails?: SortOrder
    influencedByTweet?: SortOrder
    influenceScore?: SortOrder
    agentId?: SortOrder
  }

  export type AgentStateAvgOrderByAggregateInput = {
    influenceScore?: SortOrder
  }

  export type AgentStateMaxOrderByAggregateInput = {
    id?: SortOrder
    isAlive?: SortOrder
    lastActionType?: SortOrder
    lastActionTime?: SortOrder
    lastActionDetails?: SortOrder
    influencedByTweet?: SortOrder
    influenceScore?: SortOrder
    agentId?: SortOrder
  }

  export type AgentStateMinOrderByAggregateInput = {
    id?: SortOrder
    isAlive?: SortOrder
    lastActionType?: SortOrder
    lastActionTime?: SortOrder
    lastActionDetails?: SortOrder
    influencedByTweet?: SortOrder
    influenceScore?: SortOrder
    agentId?: SortOrder
  }

  export type AgentStateSumOrderByAggregateInput = {
    influenceScore?: SortOrder
  }

  export type EnumCooldownTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CooldownType | EnumCooldownTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCooldownTypeFilter<$PrismaModel> | $Enums.CooldownType
  }

  export type CooldownAgentIdTypeCompoundUniqueInput = {
    agentId: string
    type: $Enums.CooldownType
  }

  export type CooldownCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    endsAt?: SortOrder
    agentId?: SortOrder
    targetAgentId?: SortOrder
    gameId?: SortOrder
  }

  export type CooldownMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    endsAt?: SortOrder
    agentId?: SortOrder
    targetAgentId?: SortOrder
    gameId?: SortOrder
  }

  export type CooldownMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    endsAt?: SortOrder
    agentId?: SortOrder
    targetAgentId?: SortOrder
    gameId?: SortOrder
  }

  export type EnumCooldownTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CooldownType | EnumCooldownTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCooldownTypeWithAggregatesFilter<$PrismaModel> | $Enums.CooldownType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCooldownTypeFilter<$PrismaModel>
    _max?: NestedEnumCooldownTypeFilter<$PrismaModel>
  }

  export type StrategyCountOrderByAggregateInput = {
    id?: SortOrder
    publicStrategy?: SortOrder
    actualStrategy?: SortOrder
    deceptionLevel?: SortOrder
    agentId?: SortOrder
  }

  export type StrategyAvgOrderByAggregateInput = {
    deceptionLevel?: SortOrder
  }

  export type StrategyMaxOrderByAggregateInput = {
    id?: SortOrder
    publicStrategy?: SortOrder
    actualStrategy?: SortOrder
    deceptionLevel?: SortOrder
    agentId?: SortOrder
  }

  export type StrategyMinOrderByAggregateInput = {
    id?: SortOrder
    publicStrategy?: SortOrder
    actualStrategy?: SortOrder
    deceptionLevel?: SortOrder
    agentId?: SortOrder
  }

  export type StrategySumOrderByAggregateInput = {
    deceptionLevel?: SortOrder
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    email?: SortOrder
    walletAddress?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    email?: SortOrder
    walletAddress?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    email?: SortOrder
    walletAddress?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type AgentCreateNestedManyWithoutGameInput = {
    create?: XOR<AgentCreateWithoutGameInput, AgentUncheckedCreateWithoutGameInput> | AgentCreateWithoutGameInput[] | AgentUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutGameInput | AgentCreateOrConnectWithoutGameInput[]
    createMany?: AgentCreateManyGameInputEnvelope
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
  }

  export type AllianceCreateNestedManyWithoutGameInput = {
    create?: XOR<AllianceCreateWithoutGameInput, AllianceUncheckedCreateWithoutGameInput> | AllianceCreateWithoutGameInput[] | AllianceUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutGameInput | AllianceCreateOrConnectWithoutGameInput[]
    createMany?: AllianceCreateManyGameInputEnvelope
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
  }

  export type BattleCreateNestedManyWithoutGameInput = {
    create?: XOR<BattleCreateWithoutGameInput, BattleUncheckedCreateWithoutGameInput> | BattleCreateWithoutGameInput[] | BattleUncheckedCreateWithoutGameInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutGameInput | BattleCreateOrConnectWithoutGameInput[]
    createMany?: BattleCreateManyGameInputEnvelope
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
  }

  export type CooldownCreateNestedManyWithoutGameInput = {
    create?: XOR<CooldownCreateWithoutGameInput, CooldownUncheckedCreateWithoutGameInput> | CooldownCreateWithoutGameInput[] | CooldownUncheckedCreateWithoutGameInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutGameInput | CooldownCreateOrConnectWithoutGameInput[]
    createMany?: CooldownCreateManyGameInputEnvelope
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
  }

  export type AgentUncheckedCreateNestedManyWithoutGameInput = {
    create?: XOR<AgentCreateWithoutGameInput, AgentUncheckedCreateWithoutGameInput> | AgentCreateWithoutGameInput[] | AgentUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutGameInput | AgentCreateOrConnectWithoutGameInput[]
    createMany?: AgentCreateManyGameInputEnvelope
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
  }

  export type AllianceUncheckedCreateNestedManyWithoutGameInput = {
    create?: XOR<AllianceCreateWithoutGameInput, AllianceUncheckedCreateWithoutGameInput> | AllianceCreateWithoutGameInput[] | AllianceUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutGameInput | AllianceCreateOrConnectWithoutGameInput[]
    createMany?: AllianceCreateManyGameInputEnvelope
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
  }

  export type BattleUncheckedCreateNestedManyWithoutGameInput = {
    create?: XOR<BattleCreateWithoutGameInput, BattleUncheckedCreateWithoutGameInput> | BattleCreateWithoutGameInput[] | BattleUncheckedCreateWithoutGameInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutGameInput | BattleCreateOrConnectWithoutGameInput[]
    createMany?: BattleCreateManyGameInputEnvelope
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
  }

  export type CooldownUncheckedCreateNestedManyWithoutGameInput = {
    create?: XOR<CooldownCreateWithoutGameInput, CooldownUncheckedCreateWithoutGameInput> | CooldownCreateWithoutGameInput[] | CooldownUncheckedCreateWithoutGameInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutGameInput | CooldownCreateOrConnectWithoutGameInput[]
    createMany?: CooldownCreateManyGameInputEnvelope
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type AgentUpdateManyWithoutGameNestedInput = {
    create?: XOR<AgentCreateWithoutGameInput, AgentUncheckedCreateWithoutGameInput> | AgentCreateWithoutGameInput[] | AgentUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutGameInput | AgentCreateOrConnectWithoutGameInput[]
    upsert?: AgentUpsertWithWhereUniqueWithoutGameInput | AgentUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: AgentCreateManyGameInputEnvelope
    set?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    disconnect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    delete?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    update?: AgentUpdateWithWhereUniqueWithoutGameInput | AgentUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: AgentUpdateManyWithWhereWithoutGameInput | AgentUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: AgentScalarWhereInput | AgentScalarWhereInput[]
  }

  export type AllianceUpdateManyWithoutGameNestedInput = {
    create?: XOR<AllianceCreateWithoutGameInput, AllianceUncheckedCreateWithoutGameInput> | AllianceCreateWithoutGameInput[] | AllianceUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutGameInput | AllianceCreateOrConnectWithoutGameInput[]
    upsert?: AllianceUpsertWithWhereUniqueWithoutGameInput | AllianceUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: AllianceCreateManyGameInputEnvelope
    set?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    disconnect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    delete?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    update?: AllianceUpdateWithWhereUniqueWithoutGameInput | AllianceUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: AllianceUpdateManyWithWhereWithoutGameInput | AllianceUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: AllianceScalarWhereInput | AllianceScalarWhereInput[]
  }

  export type BattleUpdateManyWithoutGameNestedInput = {
    create?: XOR<BattleCreateWithoutGameInput, BattleUncheckedCreateWithoutGameInput> | BattleCreateWithoutGameInput[] | BattleUncheckedCreateWithoutGameInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutGameInput | BattleCreateOrConnectWithoutGameInput[]
    upsert?: BattleUpsertWithWhereUniqueWithoutGameInput | BattleUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: BattleCreateManyGameInputEnvelope
    set?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    disconnect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    delete?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    update?: BattleUpdateWithWhereUniqueWithoutGameInput | BattleUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: BattleUpdateManyWithWhereWithoutGameInput | BattleUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: BattleScalarWhereInput | BattleScalarWhereInput[]
  }

  export type CooldownUpdateManyWithoutGameNestedInput = {
    create?: XOR<CooldownCreateWithoutGameInput, CooldownUncheckedCreateWithoutGameInput> | CooldownCreateWithoutGameInput[] | CooldownUncheckedCreateWithoutGameInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutGameInput | CooldownCreateOrConnectWithoutGameInput[]
    upsert?: CooldownUpsertWithWhereUniqueWithoutGameInput | CooldownUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: CooldownCreateManyGameInputEnvelope
    set?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    disconnect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    delete?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    update?: CooldownUpdateWithWhereUniqueWithoutGameInput | CooldownUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: CooldownUpdateManyWithWhereWithoutGameInput | CooldownUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: CooldownScalarWhereInput | CooldownScalarWhereInput[]
  }

  export type AgentUncheckedUpdateManyWithoutGameNestedInput = {
    create?: XOR<AgentCreateWithoutGameInput, AgentUncheckedCreateWithoutGameInput> | AgentCreateWithoutGameInput[] | AgentUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutGameInput | AgentCreateOrConnectWithoutGameInput[]
    upsert?: AgentUpsertWithWhereUniqueWithoutGameInput | AgentUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: AgentCreateManyGameInputEnvelope
    set?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    disconnect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    delete?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    update?: AgentUpdateWithWhereUniqueWithoutGameInput | AgentUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: AgentUpdateManyWithWhereWithoutGameInput | AgentUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: AgentScalarWhereInput | AgentScalarWhereInput[]
  }

  export type AllianceUncheckedUpdateManyWithoutGameNestedInput = {
    create?: XOR<AllianceCreateWithoutGameInput, AllianceUncheckedCreateWithoutGameInput> | AllianceCreateWithoutGameInput[] | AllianceUncheckedCreateWithoutGameInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutGameInput | AllianceCreateOrConnectWithoutGameInput[]
    upsert?: AllianceUpsertWithWhereUniqueWithoutGameInput | AllianceUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: AllianceCreateManyGameInputEnvelope
    set?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    disconnect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    delete?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    update?: AllianceUpdateWithWhereUniqueWithoutGameInput | AllianceUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: AllianceUpdateManyWithWhereWithoutGameInput | AllianceUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: AllianceScalarWhereInput | AllianceScalarWhereInput[]
  }

  export type BattleUncheckedUpdateManyWithoutGameNestedInput = {
    create?: XOR<BattleCreateWithoutGameInput, BattleUncheckedCreateWithoutGameInput> | BattleCreateWithoutGameInput[] | BattleUncheckedCreateWithoutGameInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutGameInput | BattleCreateOrConnectWithoutGameInput[]
    upsert?: BattleUpsertWithWhereUniqueWithoutGameInput | BattleUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: BattleCreateManyGameInputEnvelope
    set?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    disconnect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    delete?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    update?: BattleUpdateWithWhereUniqueWithoutGameInput | BattleUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: BattleUpdateManyWithWhereWithoutGameInput | BattleUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: BattleScalarWhereInput | BattleScalarWhereInput[]
  }

  export type CooldownUncheckedUpdateManyWithoutGameNestedInput = {
    create?: XOR<CooldownCreateWithoutGameInput, CooldownUncheckedCreateWithoutGameInput> | CooldownCreateWithoutGameInput[] | CooldownUncheckedCreateWithoutGameInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutGameInput | CooldownCreateOrConnectWithoutGameInput[]
    upsert?: CooldownUpsertWithWhereUniqueWithoutGameInput | CooldownUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: CooldownCreateManyGameInputEnvelope
    set?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    disconnect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    delete?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    update?: CooldownUpdateWithWhereUniqueWithoutGameInput | CooldownUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?: CooldownUpdateManyWithWhereWithoutGameInput | CooldownUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: CooldownScalarWhereInput | CooldownScalarWhereInput[]
  }

  export type AgentProfileCreatebioInput = {
    set: string[]
  }

  export type AgentProfileCreateloreInput = {
    set: string[]
  }

  export type AgentProfileCreatecharacteristicsInput = {
    set: string[]
  }

  export type AgentProfileCreateknowledgeInput = {
    set: string[]
  }

  export type AgentCreateNestedManyWithoutAgentProfileInput = {
    create?: XOR<AgentCreateWithoutAgentProfileInput, AgentUncheckedCreateWithoutAgentProfileInput> | AgentCreateWithoutAgentProfileInput[] | AgentUncheckedCreateWithoutAgentProfileInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutAgentProfileInput | AgentCreateOrConnectWithoutAgentProfileInput[]
    createMany?: AgentCreateManyAgentProfileInputEnvelope
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
  }

  export type AgentUncheckedCreateNestedManyWithoutAgentProfileInput = {
    create?: XOR<AgentCreateWithoutAgentProfileInput, AgentUncheckedCreateWithoutAgentProfileInput> | AgentCreateWithoutAgentProfileInput[] | AgentUncheckedCreateWithoutAgentProfileInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutAgentProfileInput | AgentCreateOrConnectWithoutAgentProfileInput[]
    createMany?: AgentCreateManyAgentProfileInputEnvelope
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
  }

  export type AgentProfileUpdatebioInput = {
    set?: string[]
    push?: string | string[]
  }

  export type AgentProfileUpdateloreInput = {
    set?: string[]
    push?: string | string[]
  }

  export type AgentProfileUpdatecharacteristicsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type AgentProfileUpdateknowledgeInput = {
    set?: string[]
    push?: string | string[]
  }

  export type AgentUpdateManyWithoutAgentProfileNestedInput = {
    create?: XOR<AgentCreateWithoutAgentProfileInput, AgentUncheckedCreateWithoutAgentProfileInput> | AgentCreateWithoutAgentProfileInput[] | AgentUncheckedCreateWithoutAgentProfileInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutAgentProfileInput | AgentCreateOrConnectWithoutAgentProfileInput[]
    upsert?: AgentUpsertWithWhereUniqueWithoutAgentProfileInput | AgentUpsertWithWhereUniqueWithoutAgentProfileInput[]
    createMany?: AgentCreateManyAgentProfileInputEnvelope
    set?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    disconnect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    delete?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    update?: AgentUpdateWithWhereUniqueWithoutAgentProfileInput | AgentUpdateWithWhereUniqueWithoutAgentProfileInput[]
    updateMany?: AgentUpdateManyWithWhereWithoutAgentProfileInput | AgentUpdateManyWithWhereWithoutAgentProfileInput[]
    deleteMany?: AgentScalarWhereInput | AgentScalarWhereInput[]
  }

  export type AgentUncheckedUpdateManyWithoutAgentProfileNestedInput = {
    create?: XOR<AgentCreateWithoutAgentProfileInput, AgentUncheckedCreateWithoutAgentProfileInput> | AgentCreateWithoutAgentProfileInput[] | AgentUncheckedCreateWithoutAgentProfileInput[]
    connectOrCreate?: AgentCreateOrConnectWithoutAgentProfileInput | AgentCreateOrConnectWithoutAgentProfileInput[]
    upsert?: AgentUpsertWithWhereUniqueWithoutAgentProfileInput | AgentUpsertWithWhereUniqueWithoutAgentProfileInput[]
    createMany?: AgentCreateManyAgentProfileInputEnvelope
    set?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    disconnect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    delete?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    connect?: AgentWhereUniqueInput | AgentWhereUniqueInput[]
    update?: AgentUpdateWithWhereUniqueWithoutAgentProfileInput | AgentUpdateWithWhereUniqueWithoutAgentProfileInput[]
    updateMany?: AgentUpdateManyWithWhereWithoutAgentProfileInput | AgentUpdateManyWithWhereWithoutAgentProfileInput[]
    deleteMany?: AgentScalarWhereInput | AgentScalarWhereInput[]
  }

  export type AgentProfileCreateNestedOneWithoutAgentInput = {
    create?: XOR<AgentProfileCreateWithoutAgentInput, AgentProfileUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AgentProfileCreateOrConnectWithoutAgentInput
    connect?: AgentProfileWhereUniqueInput
  }

  export type GameCreateNestedOneWithoutAgentsInput = {
    create?: XOR<GameCreateWithoutAgentsInput, GameUncheckedCreateWithoutAgentsInput>
    connectOrCreate?: GameCreateOrConnectWithoutAgentsInput
    connect?: GameWhereUniqueInput
  }

  export type LocationCreateNestedOneWithoutAgentInput = {
    create?: XOR<LocationCreateWithoutAgentInput, LocationUncheckedCreateWithoutAgentInput>
    connectOrCreate?: LocationCreateOrConnectWithoutAgentInput
    connect?: LocationWhereUniqueInput
  }

  export type AllianceCreateNestedOneWithoutAgentInput = {
    create?: XOR<AllianceCreateWithoutAgentInput, AllianceUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AllianceCreateOrConnectWithoutAgentInput
    connect?: AllianceWhereUniqueInput
  }

  export type BattleCreateNestedManyWithoutAgentInput = {
    create?: XOR<BattleCreateWithoutAgentInput, BattleUncheckedCreateWithoutAgentInput> | BattleCreateWithoutAgentInput[] | BattleUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutAgentInput | BattleCreateOrConnectWithoutAgentInput[]
    createMany?: BattleCreateManyAgentInputEnvelope
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
  }

  export type AgentStateCreateNestedOneWithoutAgentInput = {
    create?: XOR<AgentStateCreateWithoutAgentInput, AgentStateUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AgentStateCreateOrConnectWithoutAgentInput
    connect?: AgentStateWhereUniqueInput
  }

  export type StrategyCreateNestedOneWithoutAgentInput = {
    create?: XOR<StrategyCreateWithoutAgentInput, StrategyUncheckedCreateWithoutAgentInput>
    connectOrCreate?: StrategyCreateOrConnectWithoutAgentInput
    connect?: StrategyWhereUniqueInput
  }

  export type CooldownCreateNestedManyWithoutAgentInput = {
    create?: XOR<CooldownCreateWithoutAgentInput, CooldownUncheckedCreateWithoutAgentInput> | CooldownCreateWithoutAgentInput[] | CooldownUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutAgentInput | CooldownCreateOrConnectWithoutAgentInput[]
    createMany?: CooldownCreateManyAgentInputEnvelope
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
  }

  export type AllianceCreateNestedManyWithoutAlliedAgentInput = {
    create?: XOR<AllianceCreateWithoutAlliedAgentInput, AllianceUncheckedCreateWithoutAlliedAgentInput> | AllianceCreateWithoutAlliedAgentInput[] | AllianceUncheckedCreateWithoutAlliedAgentInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutAlliedAgentInput | AllianceCreateOrConnectWithoutAlliedAgentInput[]
    createMany?: AllianceCreateManyAlliedAgentInputEnvelope
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
  }

  export type BattleCreateNestedManyWithoutOpponentInput = {
    create?: XOR<BattleCreateWithoutOpponentInput, BattleUncheckedCreateWithoutOpponentInput> | BattleCreateWithoutOpponentInput[] | BattleUncheckedCreateWithoutOpponentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutOpponentInput | BattleCreateOrConnectWithoutOpponentInput[]
    createMany?: BattleCreateManyOpponentInputEnvelope
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
  }

  export type TweetCreateNestedManyWithoutAgentInput = {
    create?: XOR<TweetCreateWithoutAgentInput, TweetUncheckedCreateWithoutAgentInput> | TweetCreateWithoutAgentInput[] | TweetUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: TweetCreateOrConnectWithoutAgentInput | TweetCreateOrConnectWithoutAgentInput[]
    createMany?: TweetCreateManyAgentInputEnvelope
    connect?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
  }

  export type LocationUncheckedCreateNestedOneWithoutAgentInput = {
    create?: XOR<LocationCreateWithoutAgentInput, LocationUncheckedCreateWithoutAgentInput>
    connectOrCreate?: LocationCreateOrConnectWithoutAgentInput
    connect?: LocationWhereUniqueInput
  }

  export type AllianceUncheckedCreateNestedOneWithoutAgentInput = {
    create?: XOR<AllianceCreateWithoutAgentInput, AllianceUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AllianceCreateOrConnectWithoutAgentInput
    connect?: AllianceWhereUniqueInput
  }

  export type BattleUncheckedCreateNestedManyWithoutAgentInput = {
    create?: XOR<BattleCreateWithoutAgentInput, BattleUncheckedCreateWithoutAgentInput> | BattleCreateWithoutAgentInput[] | BattleUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutAgentInput | BattleCreateOrConnectWithoutAgentInput[]
    createMany?: BattleCreateManyAgentInputEnvelope
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
  }

  export type AgentStateUncheckedCreateNestedOneWithoutAgentInput = {
    create?: XOR<AgentStateCreateWithoutAgentInput, AgentStateUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AgentStateCreateOrConnectWithoutAgentInput
    connect?: AgentStateWhereUniqueInput
  }

  export type StrategyUncheckedCreateNestedOneWithoutAgentInput = {
    create?: XOR<StrategyCreateWithoutAgentInput, StrategyUncheckedCreateWithoutAgentInput>
    connectOrCreate?: StrategyCreateOrConnectWithoutAgentInput
    connect?: StrategyWhereUniqueInput
  }

  export type CooldownUncheckedCreateNestedManyWithoutAgentInput = {
    create?: XOR<CooldownCreateWithoutAgentInput, CooldownUncheckedCreateWithoutAgentInput> | CooldownCreateWithoutAgentInput[] | CooldownUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutAgentInput | CooldownCreateOrConnectWithoutAgentInput[]
    createMany?: CooldownCreateManyAgentInputEnvelope
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
  }

  export type AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput = {
    create?: XOR<AllianceCreateWithoutAlliedAgentInput, AllianceUncheckedCreateWithoutAlliedAgentInput> | AllianceCreateWithoutAlliedAgentInput[] | AllianceUncheckedCreateWithoutAlliedAgentInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutAlliedAgentInput | AllianceCreateOrConnectWithoutAlliedAgentInput[]
    createMany?: AllianceCreateManyAlliedAgentInputEnvelope
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
  }

  export type BattleUncheckedCreateNestedManyWithoutOpponentInput = {
    create?: XOR<BattleCreateWithoutOpponentInput, BattleUncheckedCreateWithoutOpponentInput> | BattleCreateWithoutOpponentInput[] | BattleUncheckedCreateWithoutOpponentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutOpponentInput | BattleCreateOrConnectWithoutOpponentInput[]
    createMany?: BattleCreateManyOpponentInputEnvelope
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
  }

  export type TweetUncheckedCreateNestedManyWithoutAgentInput = {
    create?: XOR<TweetCreateWithoutAgentInput, TweetUncheckedCreateWithoutAgentInput> | TweetCreateWithoutAgentInput[] | TweetUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: TweetCreateOrConnectWithoutAgentInput | TweetCreateOrConnectWithoutAgentInput[]
    createMany?: TweetCreateManyAgentInputEnvelope
    connect?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
  }

  export type AgentProfileUpdateOneRequiredWithoutAgentNestedInput = {
    create?: XOR<AgentProfileCreateWithoutAgentInput, AgentProfileUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AgentProfileCreateOrConnectWithoutAgentInput
    upsert?: AgentProfileUpsertWithoutAgentInput
    connect?: AgentProfileWhereUniqueInput
    update?: XOR<XOR<AgentProfileUpdateToOneWithWhereWithoutAgentInput, AgentProfileUpdateWithoutAgentInput>, AgentProfileUncheckedUpdateWithoutAgentInput>
  }

  export type GameUpdateOneRequiredWithoutAgentsNestedInput = {
    create?: XOR<GameCreateWithoutAgentsInput, GameUncheckedCreateWithoutAgentsInput>
    connectOrCreate?: GameCreateOrConnectWithoutAgentsInput
    upsert?: GameUpsertWithoutAgentsInput
    connect?: GameWhereUniqueInput
    update?: XOR<XOR<GameUpdateToOneWithWhereWithoutAgentsInput, GameUpdateWithoutAgentsInput>, GameUncheckedUpdateWithoutAgentsInput>
  }

  export type LocationUpdateOneWithoutAgentNestedInput = {
    create?: XOR<LocationCreateWithoutAgentInput, LocationUncheckedCreateWithoutAgentInput>
    connectOrCreate?: LocationCreateOrConnectWithoutAgentInput
    upsert?: LocationUpsertWithoutAgentInput
    disconnect?: LocationWhereInput | boolean
    delete?: LocationWhereInput | boolean
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutAgentInput, LocationUpdateWithoutAgentInput>, LocationUncheckedUpdateWithoutAgentInput>
  }

  export type AllianceUpdateOneWithoutAgentNestedInput = {
    create?: XOR<AllianceCreateWithoutAgentInput, AllianceUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AllianceCreateOrConnectWithoutAgentInput
    upsert?: AllianceUpsertWithoutAgentInput
    disconnect?: AllianceWhereInput | boolean
    delete?: AllianceWhereInput | boolean
    connect?: AllianceWhereUniqueInput
    update?: XOR<XOR<AllianceUpdateToOneWithWhereWithoutAgentInput, AllianceUpdateWithoutAgentInput>, AllianceUncheckedUpdateWithoutAgentInput>
  }

  export type BattleUpdateManyWithoutAgentNestedInput = {
    create?: XOR<BattleCreateWithoutAgentInput, BattleUncheckedCreateWithoutAgentInput> | BattleCreateWithoutAgentInput[] | BattleUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutAgentInput | BattleCreateOrConnectWithoutAgentInput[]
    upsert?: BattleUpsertWithWhereUniqueWithoutAgentInput | BattleUpsertWithWhereUniqueWithoutAgentInput[]
    createMany?: BattleCreateManyAgentInputEnvelope
    set?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    disconnect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    delete?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    update?: BattleUpdateWithWhereUniqueWithoutAgentInput | BattleUpdateWithWhereUniqueWithoutAgentInput[]
    updateMany?: BattleUpdateManyWithWhereWithoutAgentInput | BattleUpdateManyWithWhereWithoutAgentInput[]
    deleteMany?: BattleScalarWhereInput | BattleScalarWhereInput[]
  }

  export type AgentStateUpdateOneWithoutAgentNestedInput = {
    create?: XOR<AgentStateCreateWithoutAgentInput, AgentStateUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AgentStateCreateOrConnectWithoutAgentInput
    upsert?: AgentStateUpsertWithoutAgentInput
    disconnect?: AgentStateWhereInput | boolean
    delete?: AgentStateWhereInput | boolean
    connect?: AgentStateWhereUniqueInput
    update?: XOR<XOR<AgentStateUpdateToOneWithWhereWithoutAgentInput, AgentStateUpdateWithoutAgentInput>, AgentStateUncheckedUpdateWithoutAgentInput>
  }

  export type StrategyUpdateOneWithoutAgentNestedInput = {
    create?: XOR<StrategyCreateWithoutAgentInput, StrategyUncheckedCreateWithoutAgentInput>
    connectOrCreate?: StrategyCreateOrConnectWithoutAgentInput
    upsert?: StrategyUpsertWithoutAgentInput
    disconnect?: StrategyWhereInput | boolean
    delete?: StrategyWhereInput | boolean
    connect?: StrategyWhereUniqueInput
    update?: XOR<XOR<StrategyUpdateToOneWithWhereWithoutAgentInput, StrategyUpdateWithoutAgentInput>, StrategyUncheckedUpdateWithoutAgentInput>
  }

  export type CooldownUpdateManyWithoutAgentNestedInput = {
    create?: XOR<CooldownCreateWithoutAgentInput, CooldownUncheckedCreateWithoutAgentInput> | CooldownCreateWithoutAgentInput[] | CooldownUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutAgentInput | CooldownCreateOrConnectWithoutAgentInput[]
    upsert?: CooldownUpsertWithWhereUniqueWithoutAgentInput | CooldownUpsertWithWhereUniqueWithoutAgentInput[]
    createMany?: CooldownCreateManyAgentInputEnvelope
    set?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    disconnect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    delete?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    update?: CooldownUpdateWithWhereUniqueWithoutAgentInput | CooldownUpdateWithWhereUniqueWithoutAgentInput[]
    updateMany?: CooldownUpdateManyWithWhereWithoutAgentInput | CooldownUpdateManyWithWhereWithoutAgentInput[]
    deleteMany?: CooldownScalarWhereInput | CooldownScalarWhereInput[]
  }

  export type AllianceUpdateManyWithoutAlliedAgentNestedInput = {
    create?: XOR<AllianceCreateWithoutAlliedAgentInput, AllianceUncheckedCreateWithoutAlliedAgentInput> | AllianceCreateWithoutAlliedAgentInput[] | AllianceUncheckedCreateWithoutAlliedAgentInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutAlliedAgentInput | AllianceCreateOrConnectWithoutAlliedAgentInput[]
    upsert?: AllianceUpsertWithWhereUniqueWithoutAlliedAgentInput | AllianceUpsertWithWhereUniqueWithoutAlliedAgentInput[]
    createMany?: AllianceCreateManyAlliedAgentInputEnvelope
    set?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    disconnect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    delete?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    update?: AllianceUpdateWithWhereUniqueWithoutAlliedAgentInput | AllianceUpdateWithWhereUniqueWithoutAlliedAgentInput[]
    updateMany?: AllianceUpdateManyWithWhereWithoutAlliedAgentInput | AllianceUpdateManyWithWhereWithoutAlliedAgentInput[]
    deleteMany?: AllianceScalarWhereInput | AllianceScalarWhereInput[]
  }

  export type BattleUpdateManyWithoutOpponentNestedInput = {
    create?: XOR<BattleCreateWithoutOpponentInput, BattleUncheckedCreateWithoutOpponentInput> | BattleCreateWithoutOpponentInput[] | BattleUncheckedCreateWithoutOpponentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutOpponentInput | BattleCreateOrConnectWithoutOpponentInput[]
    upsert?: BattleUpsertWithWhereUniqueWithoutOpponentInput | BattleUpsertWithWhereUniqueWithoutOpponentInput[]
    createMany?: BattleCreateManyOpponentInputEnvelope
    set?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    disconnect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    delete?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    update?: BattleUpdateWithWhereUniqueWithoutOpponentInput | BattleUpdateWithWhereUniqueWithoutOpponentInput[]
    updateMany?: BattleUpdateManyWithWhereWithoutOpponentInput | BattleUpdateManyWithWhereWithoutOpponentInput[]
    deleteMany?: BattleScalarWhereInput | BattleScalarWhereInput[]
  }

  export type TweetUpdateManyWithoutAgentNestedInput = {
    create?: XOR<TweetCreateWithoutAgentInput, TweetUncheckedCreateWithoutAgentInput> | TweetCreateWithoutAgentInput[] | TweetUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: TweetCreateOrConnectWithoutAgentInput | TweetCreateOrConnectWithoutAgentInput[]
    upsert?: TweetUpsertWithWhereUniqueWithoutAgentInput | TweetUpsertWithWhereUniqueWithoutAgentInput[]
    createMany?: TweetCreateManyAgentInputEnvelope
    set?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    disconnect?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    delete?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    connect?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    update?: TweetUpdateWithWhereUniqueWithoutAgentInput | TweetUpdateWithWhereUniqueWithoutAgentInput[]
    updateMany?: TweetUpdateManyWithWhereWithoutAgentInput | TweetUpdateManyWithWhereWithoutAgentInput[]
    deleteMany?: TweetScalarWhereInput | TweetScalarWhereInput[]
  }

  export type LocationUncheckedUpdateOneWithoutAgentNestedInput = {
    create?: XOR<LocationCreateWithoutAgentInput, LocationUncheckedCreateWithoutAgentInput>
    connectOrCreate?: LocationCreateOrConnectWithoutAgentInput
    upsert?: LocationUpsertWithoutAgentInput
    disconnect?: LocationWhereInput | boolean
    delete?: LocationWhereInput | boolean
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutAgentInput, LocationUpdateWithoutAgentInput>, LocationUncheckedUpdateWithoutAgentInput>
  }

  export type AllianceUncheckedUpdateOneWithoutAgentNestedInput = {
    create?: XOR<AllianceCreateWithoutAgentInput, AllianceUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AllianceCreateOrConnectWithoutAgentInput
    upsert?: AllianceUpsertWithoutAgentInput
    disconnect?: AllianceWhereInput | boolean
    delete?: AllianceWhereInput | boolean
    connect?: AllianceWhereUniqueInput
    update?: XOR<XOR<AllianceUpdateToOneWithWhereWithoutAgentInput, AllianceUpdateWithoutAgentInput>, AllianceUncheckedUpdateWithoutAgentInput>
  }

  export type BattleUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: XOR<BattleCreateWithoutAgentInput, BattleUncheckedCreateWithoutAgentInput> | BattleCreateWithoutAgentInput[] | BattleUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutAgentInput | BattleCreateOrConnectWithoutAgentInput[]
    upsert?: BattleUpsertWithWhereUniqueWithoutAgentInput | BattleUpsertWithWhereUniqueWithoutAgentInput[]
    createMany?: BattleCreateManyAgentInputEnvelope
    set?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    disconnect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    delete?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    update?: BattleUpdateWithWhereUniqueWithoutAgentInput | BattleUpdateWithWhereUniqueWithoutAgentInput[]
    updateMany?: BattleUpdateManyWithWhereWithoutAgentInput | BattleUpdateManyWithWhereWithoutAgentInput[]
    deleteMany?: BattleScalarWhereInput | BattleScalarWhereInput[]
  }

  export type AgentStateUncheckedUpdateOneWithoutAgentNestedInput = {
    create?: XOR<AgentStateCreateWithoutAgentInput, AgentStateUncheckedCreateWithoutAgentInput>
    connectOrCreate?: AgentStateCreateOrConnectWithoutAgentInput
    upsert?: AgentStateUpsertWithoutAgentInput
    disconnect?: AgentStateWhereInput | boolean
    delete?: AgentStateWhereInput | boolean
    connect?: AgentStateWhereUniqueInput
    update?: XOR<XOR<AgentStateUpdateToOneWithWhereWithoutAgentInput, AgentStateUpdateWithoutAgentInput>, AgentStateUncheckedUpdateWithoutAgentInput>
  }

  export type StrategyUncheckedUpdateOneWithoutAgentNestedInput = {
    create?: XOR<StrategyCreateWithoutAgentInput, StrategyUncheckedCreateWithoutAgentInput>
    connectOrCreate?: StrategyCreateOrConnectWithoutAgentInput
    upsert?: StrategyUpsertWithoutAgentInput
    disconnect?: StrategyWhereInput | boolean
    delete?: StrategyWhereInput | boolean
    connect?: StrategyWhereUniqueInput
    update?: XOR<XOR<StrategyUpdateToOneWithWhereWithoutAgentInput, StrategyUpdateWithoutAgentInput>, StrategyUncheckedUpdateWithoutAgentInput>
  }

  export type CooldownUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: XOR<CooldownCreateWithoutAgentInput, CooldownUncheckedCreateWithoutAgentInput> | CooldownCreateWithoutAgentInput[] | CooldownUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: CooldownCreateOrConnectWithoutAgentInput | CooldownCreateOrConnectWithoutAgentInput[]
    upsert?: CooldownUpsertWithWhereUniqueWithoutAgentInput | CooldownUpsertWithWhereUniqueWithoutAgentInput[]
    createMany?: CooldownCreateManyAgentInputEnvelope
    set?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    disconnect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    delete?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    connect?: CooldownWhereUniqueInput | CooldownWhereUniqueInput[]
    update?: CooldownUpdateWithWhereUniqueWithoutAgentInput | CooldownUpdateWithWhereUniqueWithoutAgentInput[]
    updateMany?: CooldownUpdateManyWithWhereWithoutAgentInput | CooldownUpdateManyWithWhereWithoutAgentInput[]
    deleteMany?: CooldownScalarWhereInput | CooldownScalarWhereInput[]
  }

  export type AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput = {
    create?: XOR<AllianceCreateWithoutAlliedAgentInput, AllianceUncheckedCreateWithoutAlliedAgentInput> | AllianceCreateWithoutAlliedAgentInput[] | AllianceUncheckedCreateWithoutAlliedAgentInput[]
    connectOrCreate?: AllianceCreateOrConnectWithoutAlliedAgentInput | AllianceCreateOrConnectWithoutAlliedAgentInput[]
    upsert?: AllianceUpsertWithWhereUniqueWithoutAlliedAgentInput | AllianceUpsertWithWhereUniqueWithoutAlliedAgentInput[]
    createMany?: AllianceCreateManyAlliedAgentInputEnvelope
    set?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    disconnect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    delete?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    connect?: AllianceWhereUniqueInput | AllianceWhereUniqueInput[]
    update?: AllianceUpdateWithWhereUniqueWithoutAlliedAgentInput | AllianceUpdateWithWhereUniqueWithoutAlliedAgentInput[]
    updateMany?: AllianceUpdateManyWithWhereWithoutAlliedAgentInput | AllianceUpdateManyWithWhereWithoutAlliedAgentInput[]
    deleteMany?: AllianceScalarWhereInput | AllianceScalarWhereInput[]
  }

  export type BattleUncheckedUpdateManyWithoutOpponentNestedInput = {
    create?: XOR<BattleCreateWithoutOpponentInput, BattleUncheckedCreateWithoutOpponentInput> | BattleCreateWithoutOpponentInput[] | BattleUncheckedCreateWithoutOpponentInput[]
    connectOrCreate?: BattleCreateOrConnectWithoutOpponentInput | BattleCreateOrConnectWithoutOpponentInput[]
    upsert?: BattleUpsertWithWhereUniqueWithoutOpponentInput | BattleUpsertWithWhereUniqueWithoutOpponentInput[]
    createMany?: BattleCreateManyOpponentInputEnvelope
    set?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    disconnect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    delete?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    connect?: BattleWhereUniqueInput | BattleWhereUniqueInput[]
    update?: BattleUpdateWithWhereUniqueWithoutOpponentInput | BattleUpdateWithWhereUniqueWithoutOpponentInput[]
    updateMany?: BattleUpdateManyWithWhereWithoutOpponentInput | BattleUpdateManyWithWhereWithoutOpponentInput[]
    deleteMany?: BattleScalarWhereInput | BattleScalarWhereInput[]
  }

  export type TweetUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: XOR<TweetCreateWithoutAgentInput, TweetUncheckedCreateWithoutAgentInput> | TweetCreateWithoutAgentInput[] | TweetUncheckedCreateWithoutAgentInput[]
    connectOrCreate?: TweetCreateOrConnectWithoutAgentInput | TweetCreateOrConnectWithoutAgentInput[]
    upsert?: TweetUpsertWithWhereUniqueWithoutAgentInput | TweetUpsertWithWhereUniqueWithoutAgentInput[]
    createMany?: TweetCreateManyAgentInputEnvelope
    set?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    disconnect?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    delete?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    connect?: TweetWhereUniqueInput | TweetWhereUniqueInput[]
    update?: TweetUpdateWithWhereUniqueWithoutAgentInput | TweetUpdateWithWhereUniqueWithoutAgentInput[]
    updateMany?: TweetUpdateManyWithWhereWithoutAgentInput | TweetUpdateManyWithWhereWithoutAgentInput[]
    deleteMany?: TweetScalarWhereInput | TweetScalarWhereInput[]
  }

  export type AgentCreateNestedOneWithoutTweetInput = {
    create?: XOR<AgentCreateWithoutTweetInput, AgentUncheckedCreateWithoutTweetInput>
    connectOrCreate?: AgentCreateOrConnectWithoutTweetInput
    connect?: AgentWhereUniqueInput
  }

  export type InteractionCreateNestedManyWithoutTweetInput = {
    create?: XOR<InteractionCreateWithoutTweetInput, InteractionUncheckedCreateWithoutTweetInput> | InteractionCreateWithoutTweetInput[] | InteractionUncheckedCreateWithoutTweetInput[]
    connectOrCreate?: InteractionCreateOrConnectWithoutTweetInput | InteractionCreateOrConnectWithoutTweetInput[]
    createMany?: InteractionCreateManyTweetInputEnvelope
    connect?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
  }

  export type InteractionUncheckedCreateNestedManyWithoutTweetInput = {
    create?: XOR<InteractionCreateWithoutTweetInput, InteractionUncheckedCreateWithoutTweetInput> | InteractionCreateWithoutTweetInput[] | InteractionUncheckedCreateWithoutTweetInput[]
    connectOrCreate?: InteractionCreateOrConnectWithoutTweetInput | InteractionCreateOrConnectWithoutTweetInput[]
    createMany?: InteractionCreateManyTweetInputEnvelope
    connect?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type AgentUpdateOneRequiredWithoutTweetNestedInput = {
    create?: XOR<AgentCreateWithoutTweetInput, AgentUncheckedCreateWithoutTweetInput>
    connectOrCreate?: AgentCreateOrConnectWithoutTweetInput
    upsert?: AgentUpsertWithoutTweetInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutTweetInput, AgentUpdateWithoutTweetInput>, AgentUncheckedUpdateWithoutTweetInput>
  }

  export type InteractionUpdateManyWithoutTweetNestedInput = {
    create?: XOR<InteractionCreateWithoutTweetInput, InteractionUncheckedCreateWithoutTweetInput> | InteractionCreateWithoutTweetInput[] | InteractionUncheckedCreateWithoutTweetInput[]
    connectOrCreate?: InteractionCreateOrConnectWithoutTweetInput | InteractionCreateOrConnectWithoutTweetInput[]
    upsert?: InteractionUpsertWithWhereUniqueWithoutTweetInput | InteractionUpsertWithWhereUniqueWithoutTweetInput[]
    createMany?: InteractionCreateManyTweetInputEnvelope
    set?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    disconnect?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    delete?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    connect?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    update?: InteractionUpdateWithWhereUniqueWithoutTweetInput | InteractionUpdateWithWhereUniqueWithoutTweetInput[]
    updateMany?: InteractionUpdateManyWithWhereWithoutTweetInput | InteractionUpdateManyWithWhereWithoutTweetInput[]
    deleteMany?: InteractionScalarWhereInput | InteractionScalarWhereInput[]
  }

  export type InteractionUncheckedUpdateManyWithoutTweetNestedInput = {
    create?: XOR<InteractionCreateWithoutTweetInput, InteractionUncheckedCreateWithoutTweetInput> | InteractionCreateWithoutTweetInput[] | InteractionUncheckedCreateWithoutTweetInput[]
    connectOrCreate?: InteractionCreateOrConnectWithoutTweetInput | InteractionCreateOrConnectWithoutTweetInput[]
    upsert?: InteractionUpsertWithWhereUniqueWithoutTweetInput | InteractionUpsertWithWhereUniqueWithoutTweetInput[]
    createMany?: InteractionCreateManyTweetInputEnvelope
    set?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    disconnect?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    delete?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    connect?: InteractionWhereUniqueInput | InteractionWhereUniqueInput[]
    update?: InteractionUpdateWithWhereUniqueWithoutTweetInput | InteractionUpdateWithWhereUniqueWithoutTweetInput[]
    updateMany?: InteractionUpdateManyWithWhereWithoutTweetInput | InteractionUpdateManyWithWhereWithoutTweetInput[]
    deleteMany?: InteractionScalarWhereInput | InteractionScalarWhereInput[]
  }

  export type AgentCreateNestedOneWithoutLocationInput = {
    create?: XOR<AgentCreateWithoutLocationInput, AgentUncheckedCreateWithoutLocationInput>
    connectOrCreate?: AgentCreateOrConnectWithoutLocationInput
    connect?: AgentWhereUniqueInput
  }

  export type EnumTerrainTypeFieldUpdateOperationsInput = {
    set?: $Enums.TerrainType
  }

  export type AgentUpdateOneRequiredWithoutLocationNestedInput = {
    create?: XOR<AgentCreateWithoutLocationInput, AgentUncheckedCreateWithoutLocationInput>
    connectOrCreate?: AgentCreateOrConnectWithoutLocationInput
    upsert?: AgentUpsertWithoutLocationInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutLocationInput, AgentUpdateWithoutLocationInput>, AgentUncheckedUpdateWithoutLocationInput>
  }

  export type GameCreateNestedOneWithoutAlliancesInput = {
    create?: XOR<GameCreateWithoutAlliancesInput, GameUncheckedCreateWithoutAlliancesInput>
    connectOrCreate?: GameCreateOrConnectWithoutAlliancesInput
    connect?: GameWhereUniqueInput
  }

  export type AgentCreateNestedOneWithoutCurrentAllianceInput = {
    create?: XOR<AgentCreateWithoutCurrentAllianceInput, AgentUncheckedCreateWithoutCurrentAllianceInput>
    connectOrCreate?: AgentCreateOrConnectWithoutCurrentAllianceInput
    connect?: AgentWhereUniqueInput
  }

  export type AgentCreateNestedOneWithoutAlliedByInput = {
    create?: XOR<AgentCreateWithoutAlliedByInput, AgentUncheckedCreateWithoutAlliedByInput>
    connectOrCreate?: AgentCreateOrConnectWithoutAlliedByInput
    connect?: AgentWhereUniqueInput
  }

  export type EnumAllianceStatusFieldUpdateOperationsInput = {
    set?: $Enums.AllianceStatus
  }

  export type GameUpdateOneRequiredWithoutAlliancesNestedInput = {
    create?: XOR<GameCreateWithoutAlliancesInput, GameUncheckedCreateWithoutAlliancesInput>
    connectOrCreate?: GameCreateOrConnectWithoutAlliancesInput
    upsert?: GameUpsertWithoutAlliancesInput
    connect?: GameWhereUniqueInput
    update?: XOR<XOR<GameUpdateToOneWithWhereWithoutAlliancesInput, GameUpdateWithoutAlliancesInput>, GameUncheckedUpdateWithoutAlliancesInput>
  }

  export type AgentUpdateOneRequiredWithoutCurrentAllianceNestedInput = {
    create?: XOR<AgentCreateWithoutCurrentAllianceInput, AgentUncheckedCreateWithoutCurrentAllianceInput>
    connectOrCreate?: AgentCreateOrConnectWithoutCurrentAllianceInput
    upsert?: AgentUpsertWithoutCurrentAllianceInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutCurrentAllianceInput, AgentUpdateWithoutCurrentAllianceInput>, AgentUncheckedUpdateWithoutCurrentAllianceInput>
  }

  export type AgentUpdateOneRequiredWithoutAlliedByNestedInput = {
    create?: XOR<AgentCreateWithoutAlliedByInput, AgentUncheckedCreateWithoutAlliedByInput>
    connectOrCreate?: AgentCreateOrConnectWithoutAlliedByInput
    upsert?: AgentUpsertWithoutAlliedByInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutAlliedByInput, AgentUpdateWithoutAlliedByInput>, AgentUncheckedUpdateWithoutAlliedByInput>
  }

  export type GameCreateNestedOneWithoutBattlesInput = {
    create?: XOR<GameCreateWithoutBattlesInput, GameUncheckedCreateWithoutBattlesInput>
    connectOrCreate?: GameCreateOrConnectWithoutBattlesInput
    connect?: GameWhereUniqueInput
  }

  export type AgentCreateNestedOneWithoutBattlesInput = {
    create?: XOR<AgentCreateWithoutBattlesInput, AgentUncheckedCreateWithoutBattlesInput>
    connectOrCreate?: AgentCreateOrConnectWithoutBattlesInput
    connect?: AgentWhereUniqueInput
  }

  export type AgentCreateNestedOneWithoutBattlesAsOpponentInput = {
    create?: XOR<AgentCreateWithoutBattlesAsOpponentInput, AgentUncheckedCreateWithoutBattlesAsOpponentInput>
    connectOrCreate?: AgentCreateOrConnectWithoutBattlesAsOpponentInput
    connect?: AgentWhereUniqueInput
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumBattleTypeFieldUpdateOperationsInput = {
    set?: $Enums.BattleType
  }

  export type EnumBattleStatusFieldUpdateOperationsInput = {
    set?: $Enums.BattleStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type GameUpdateOneRequiredWithoutBattlesNestedInput = {
    create?: XOR<GameCreateWithoutBattlesInput, GameUncheckedCreateWithoutBattlesInput>
    connectOrCreate?: GameCreateOrConnectWithoutBattlesInput
    upsert?: GameUpsertWithoutBattlesInput
    connect?: GameWhereUniqueInput
    update?: XOR<XOR<GameUpdateToOneWithWhereWithoutBattlesInput, GameUpdateWithoutBattlesInput>, GameUncheckedUpdateWithoutBattlesInput>
  }

  export type AgentUpdateOneRequiredWithoutBattlesNestedInput = {
    create?: XOR<AgentCreateWithoutBattlesInput, AgentUncheckedCreateWithoutBattlesInput>
    connectOrCreate?: AgentCreateOrConnectWithoutBattlesInput
    upsert?: AgentUpsertWithoutBattlesInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutBattlesInput, AgentUpdateWithoutBattlesInput>, AgentUncheckedUpdateWithoutBattlesInput>
  }

  export type AgentUpdateOneRequiredWithoutBattlesAsOpponentNestedInput = {
    create?: XOR<AgentCreateWithoutBattlesAsOpponentInput, AgentUncheckedCreateWithoutBattlesAsOpponentInput>
    connectOrCreate?: AgentCreateOrConnectWithoutBattlesAsOpponentInput
    upsert?: AgentUpsertWithoutBattlesAsOpponentInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutBattlesAsOpponentInput, AgentUpdateWithoutBattlesAsOpponentInput>, AgentUncheckedUpdateWithoutBattlesAsOpponentInput>
  }

  export type TweetCreateNestedOneWithoutInteractionsInput = {
    create?: XOR<TweetCreateWithoutInteractionsInput, TweetUncheckedCreateWithoutInteractionsInput>
    connectOrCreate?: TweetCreateOrConnectWithoutInteractionsInput
    connect?: TweetWhereUniqueInput
  }

  export type TweetUpdateOneRequiredWithoutInteractionsNestedInput = {
    create?: XOR<TweetCreateWithoutInteractionsInput, TweetUncheckedCreateWithoutInteractionsInput>
    connectOrCreate?: TweetCreateOrConnectWithoutInteractionsInput
    upsert?: TweetUpsertWithoutInteractionsInput
    connect?: TweetWhereUniqueInput
    update?: XOR<XOR<TweetUpdateToOneWithWhereWithoutInteractionsInput, TweetUpdateWithoutInteractionsInput>, TweetUncheckedUpdateWithoutInteractionsInput>
  }

  export type AgentCreateNestedOneWithoutStateInput = {
    create?: XOR<AgentCreateWithoutStateInput, AgentUncheckedCreateWithoutStateInput>
    connectOrCreate?: AgentCreateOrConnectWithoutStateInput
    connect?: AgentWhereUniqueInput
  }

  export type AgentUpdateOneRequiredWithoutStateNestedInput = {
    create?: XOR<AgentCreateWithoutStateInput, AgentUncheckedCreateWithoutStateInput>
    connectOrCreate?: AgentCreateOrConnectWithoutStateInput
    upsert?: AgentUpsertWithoutStateInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutStateInput, AgentUpdateWithoutStateInput>, AgentUncheckedUpdateWithoutStateInput>
  }

  export type AgentCreateNestedOneWithoutCooldownsInput = {
    create?: XOR<AgentCreateWithoutCooldownsInput, AgentUncheckedCreateWithoutCooldownsInput>
    connectOrCreate?: AgentCreateOrConnectWithoutCooldownsInput
    connect?: AgentWhereUniqueInput
  }

  export type GameCreateNestedOneWithoutCooldownInput = {
    create?: XOR<GameCreateWithoutCooldownInput, GameUncheckedCreateWithoutCooldownInput>
    connectOrCreate?: GameCreateOrConnectWithoutCooldownInput
    connect?: GameWhereUniqueInput
  }

  export type EnumCooldownTypeFieldUpdateOperationsInput = {
    set?: $Enums.CooldownType
  }

  export type AgentUpdateOneRequiredWithoutCooldownsNestedInput = {
    create?: XOR<AgentCreateWithoutCooldownsInput, AgentUncheckedCreateWithoutCooldownsInput>
    connectOrCreate?: AgentCreateOrConnectWithoutCooldownsInput
    upsert?: AgentUpsertWithoutCooldownsInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutCooldownsInput, AgentUpdateWithoutCooldownsInput>, AgentUncheckedUpdateWithoutCooldownsInput>
  }

  export type GameUpdateOneRequiredWithoutCooldownNestedInput = {
    create?: XOR<GameCreateWithoutCooldownInput, GameUncheckedCreateWithoutCooldownInput>
    connectOrCreate?: GameCreateOrConnectWithoutCooldownInput
    upsert?: GameUpsertWithoutCooldownInput
    connect?: GameWhereUniqueInput
    update?: XOR<XOR<GameUpdateToOneWithWhereWithoutCooldownInput, GameUpdateWithoutCooldownInput>, GameUncheckedUpdateWithoutCooldownInput>
  }

  export type AgentCreateNestedOneWithoutStrategyInput = {
    create?: XOR<AgentCreateWithoutStrategyInput, AgentUncheckedCreateWithoutStrategyInput>
    connectOrCreate?: AgentCreateOrConnectWithoutStrategyInput
    connect?: AgentWhereUniqueInput
  }

  export type AgentUpdateOneRequiredWithoutStrategyNestedInput = {
    create?: XOR<AgentCreateWithoutStrategyInput, AgentUncheckedCreateWithoutStrategyInput>
    connectOrCreate?: AgentCreateOrConnectWithoutStrategyInput
    upsert?: AgentUpsertWithoutStrategyInput
    connect?: AgentWhereUniqueInput
    update?: XOR<XOR<AgentUpdateToOneWithWhereWithoutStrategyInput, AgentUpdateWithoutStrategyInput>, AgentUncheckedUpdateWithoutStrategyInput>
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumTerrainTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TerrainType | EnumTerrainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTerrainTypeFilter<$PrismaModel> | $Enums.TerrainType
  }

  export type NestedEnumTerrainTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TerrainType | EnumTerrainTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TerrainType[] | ListEnumTerrainTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTerrainTypeWithAggregatesFilter<$PrismaModel> | $Enums.TerrainType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTerrainTypeFilter<$PrismaModel>
    _max?: NestedEnumTerrainTypeFilter<$PrismaModel>
  }

  export type NestedEnumAllianceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AllianceStatus | EnumAllianceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAllianceStatusFilter<$PrismaModel> | $Enums.AllianceStatus
  }

  export type NestedEnumAllianceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AllianceStatus | EnumAllianceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AllianceStatus[] | ListEnumAllianceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAllianceStatusWithAggregatesFilter<$PrismaModel> | $Enums.AllianceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAllianceStatusFilter<$PrismaModel>
    _max?: NestedEnumAllianceStatusFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumBattleTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleType | EnumBattleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleTypeFilter<$PrismaModel> | $Enums.BattleType
  }

  export type NestedEnumBattleStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleStatus | EnumBattleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleStatusFilter<$PrismaModel> | $Enums.BattleStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedEnumBattleTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleType | EnumBattleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleType[] | ListEnumBattleTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleTypeWithAggregatesFilter<$PrismaModel> | $Enums.BattleType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBattleTypeFilter<$PrismaModel>
    _max?: NestedEnumBattleTypeFilter<$PrismaModel>
  }

  export type NestedEnumBattleStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BattleStatus | EnumBattleStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BattleStatus[] | ListEnumBattleStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBattleStatusWithAggregatesFilter<$PrismaModel> | $Enums.BattleStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBattleStatusFilter<$PrismaModel>
    _max?: NestedEnumBattleStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumCooldownTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CooldownType | EnumCooldownTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCooldownTypeFilter<$PrismaModel> | $Enums.CooldownType
  }

  export type NestedEnumCooldownTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CooldownType | EnumCooldownTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CooldownType[] | ListEnumCooldownTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCooldownTypeWithAggregatesFilter<$PrismaModel> | $Enums.CooldownType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCooldownTypeFilter<$PrismaModel>
    _max?: NestedEnumCooldownTypeFilter<$PrismaModel>
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type AgentCreateWithoutGameInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutGameInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutGameInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutGameInput, AgentUncheckedCreateWithoutGameInput>
  }

  export type AgentCreateManyGameInputEnvelope = {
    data: AgentCreateManyGameInput | AgentCreateManyGameInput[]
    skipDuplicates?: boolean
  }

  export type AllianceCreateWithoutGameInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    agent: AgentCreateNestedOneWithoutCurrentAllianceInput
    alliedAgent: AgentCreateNestedOneWithoutAlliedByInput
  }

  export type AllianceUncheckedCreateWithoutGameInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    agentId: string
    alliedAgentId: string
  }

  export type AllianceCreateOrConnectWithoutGameInput = {
    where: AllianceWhereUniqueInput
    create: XOR<AllianceCreateWithoutGameInput, AllianceUncheckedCreateWithoutGameInput>
  }

  export type AllianceCreateManyGameInputEnvelope = {
    data: AllianceCreateManyGameInput | AllianceCreateManyGameInput[]
    skipDuplicates?: boolean
  }

  export type BattleCreateWithoutGameInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
    agent: AgentCreateNestedOneWithoutBattlesInput
    opponent: AgentCreateNestedOneWithoutBattlesAsOpponentInput
  }

  export type BattleUncheckedCreateWithoutGameInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    agentId: string
    opponentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type BattleCreateOrConnectWithoutGameInput = {
    where: BattleWhereUniqueInput
    create: XOR<BattleCreateWithoutGameInput, BattleUncheckedCreateWithoutGameInput>
  }

  export type BattleCreateManyGameInputEnvelope = {
    data: BattleCreateManyGameInput | BattleCreateManyGameInput[]
    skipDuplicates?: boolean
  }

  export type CooldownCreateWithoutGameInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    targetAgentId?: string | null
    agent: AgentCreateNestedOneWithoutCooldownsInput
  }

  export type CooldownUncheckedCreateWithoutGameInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    agentId: string
    targetAgentId?: string | null
  }

  export type CooldownCreateOrConnectWithoutGameInput = {
    where: CooldownWhereUniqueInput
    create: XOR<CooldownCreateWithoutGameInput, CooldownUncheckedCreateWithoutGameInput>
  }

  export type CooldownCreateManyGameInputEnvelope = {
    data: CooldownCreateManyGameInput | CooldownCreateManyGameInput[]
    skipDuplicates?: boolean
  }

  export type AgentUpsertWithWhereUniqueWithoutGameInput = {
    where: AgentWhereUniqueInput
    update: XOR<AgentUpdateWithoutGameInput, AgentUncheckedUpdateWithoutGameInput>
    create: XOR<AgentCreateWithoutGameInput, AgentUncheckedCreateWithoutGameInput>
  }

  export type AgentUpdateWithWhereUniqueWithoutGameInput = {
    where: AgentWhereUniqueInput
    data: XOR<AgentUpdateWithoutGameInput, AgentUncheckedUpdateWithoutGameInput>
  }

  export type AgentUpdateManyWithWhereWithoutGameInput = {
    where: AgentScalarWhereInput
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyWithoutGameInput>
  }

  export type AgentScalarWhereInput = {
    AND?: AgentScalarWhereInput | AgentScalarWhereInput[]
    OR?: AgentScalarWhereInput[]
    NOT?: AgentScalarWhereInput | AgentScalarWhereInput[]
    id?: StringFilter<"Agent"> | string
    agentId?: IntFilter<"Agent"> | number
    publicKey?: StringFilter<"Agent"> | string
    agentProfileId?: StringFilter<"Agent"> | string
    health?: IntFilter<"Agent"> | number
    createdAt?: DateTimeFilter<"Agent"> | Date | string
    updatedAt?: DateTimeFilter<"Agent"> | Date | string
    gameId?: StringFilter<"Agent"> | string
  }

  export type AllianceUpsertWithWhereUniqueWithoutGameInput = {
    where: AllianceWhereUniqueInput
    update: XOR<AllianceUpdateWithoutGameInput, AllianceUncheckedUpdateWithoutGameInput>
    create: XOR<AllianceCreateWithoutGameInput, AllianceUncheckedCreateWithoutGameInput>
  }

  export type AllianceUpdateWithWhereUniqueWithoutGameInput = {
    where: AllianceWhereUniqueInput
    data: XOR<AllianceUpdateWithoutGameInput, AllianceUncheckedUpdateWithoutGameInput>
  }

  export type AllianceUpdateManyWithWhereWithoutGameInput = {
    where: AllianceScalarWhereInput
    data: XOR<AllianceUpdateManyMutationInput, AllianceUncheckedUpdateManyWithoutGameInput>
  }

  export type AllianceScalarWhereInput = {
    AND?: AllianceScalarWhereInput | AllianceScalarWhereInput[]
    OR?: AllianceScalarWhereInput[]
    NOT?: AllianceScalarWhereInput | AllianceScalarWhereInput[]
    id?: StringFilter<"Alliance"> | string
    formedAt?: DateTimeFilter<"Alliance"> | Date | string
    combinedTokens?: FloatFilter<"Alliance"> | number
    status?: EnumAllianceStatusFilter<"Alliance"> | $Enums.AllianceStatus
    gameId?: StringFilter<"Alliance"> | string
    agentId?: StringFilter<"Alliance"> | string
    alliedAgentId?: StringFilter<"Alliance"> | string
  }

  export type BattleUpsertWithWhereUniqueWithoutGameInput = {
    where: BattleWhereUniqueInput
    update: XOR<BattleUpdateWithoutGameInput, BattleUncheckedUpdateWithoutGameInput>
    create: XOR<BattleCreateWithoutGameInput, BattleUncheckedCreateWithoutGameInput>
  }

  export type BattleUpdateWithWhereUniqueWithoutGameInput = {
    where: BattleWhereUniqueInput
    data: XOR<BattleUpdateWithoutGameInput, BattleUncheckedUpdateWithoutGameInput>
  }

  export type BattleUpdateManyWithWhereWithoutGameInput = {
    where: BattleScalarWhereInput
    data: XOR<BattleUpdateManyMutationInput, BattleUncheckedUpdateManyWithoutGameInput>
  }

  export type BattleScalarWhereInput = {
    AND?: BattleScalarWhereInput | BattleScalarWhereInput[]
    OR?: BattleScalarWhereInput[]
    NOT?: BattleScalarWhereInput | BattleScalarWhereInput[]
    id?: StringFilter<"Battle"> | string
    timestamp?: DateTimeFilter<"Battle"> | Date | string
    outcome?: StringFilter<"Battle"> | string
    tokensLost?: FloatNullableFilter<"Battle"> | number | null
    tokensGained?: FloatNullableFilter<"Battle"> | number | null
    probability?: FloatFilter<"Battle"> | number
    gameId?: StringFilter<"Battle"> | string
    agentId?: StringFilter<"Battle"> | string
    opponentId?: StringFilter<"Battle"> | string
    type?: EnumBattleTypeFilter<"Battle"> | $Enums.BattleType
    status?: EnumBattleStatusFilter<"Battle"> | $Enums.BattleStatus
    startTime?: DateTimeFilter<"Battle"> | Date | string
    resolutionTime?: DateTimeFilter<"Battle"> | Date | string
    resolvedAt?: DateTimeNullableFilter<"Battle"> | Date | string | null
  }

  export type CooldownUpsertWithWhereUniqueWithoutGameInput = {
    where: CooldownWhereUniqueInput
    update: XOR<CooldownUpdateWithoutGameInput, CooldownUncheckedUpdateWithoutGameInput>
    create: XOR<CooldownCreateWithoutGameInput, CooldownUncheckedCreateWithoutGameInput>
  }

  export type CooldownUpdateWithWhereUniqueWithoutGameInput = {
    where: CooldownWhereUniqueInput
    data: XOR<CooldownUpdateWithoutGameInput, CooldownUncheckedUpdateWithoutGameInput>
  }

  export type CooldownUpdateManyWithWhereWithoutGameInput = {
    where: CooldownScalarWhereInput
    data: XOR<CooldownUpdateManyMutationInput, CooldownUncheckedUpdateManyWithoutGameInput>
  }

  export type CooldownScalarWhereInput = {
    AND?: CooldownScalarWhereInput | CooldownScalarWhereInput[]
    OR?: CooldownScalarWhereInput[]
    NOT?: CooldownScalarWhereInput | CooldownScalarWhereInput[]
    id?: StringFilter<"Cooldown"> | string
    type?: EnumCooldownTypeFilter<"Cooldown"> | $Enums.CooldownType
    endsAt?: DateTimeFilter<"Cooldown"> | Date | string
    agentId?: StringFilter<"Cooldown"> | string
    targetAgentId?: StringNullableFilter<"Cooldown"> | string | null
    gameId?: StringFilter<"Cooldown"> | string
  }

  export type AgentCreateWithoutAgentProfileInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutAgentProfileInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutAgentProfileInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutAgentProfileInput, AgentUncheckedCreateWithoutAgentProfileInput>
  }

  export type AgentCreateManyAgentProfileInputEnvelope = {
    data: AgentCreateManyAgentProfileInput | AgentCreateManyAgentProfileInput[]
    skipDuplicates?: boolean
  }

  export type AgentUpsertWithWhereUniqueWithoutAgentProfileInput = {
    where: AgentWhereUniqueInput
    update: XOR<AgentUpdateWithoutAgentProfileInput, AgentUncheckedUpdateWithoutAgentProfileInput>
    create: XOR<AgentCreateWithoutAgentProfileInput, AgentUncheckedCreateWithoutAgentProfileInput>
  }

  export type AgentUpdateWithWhereUniqueWithoutAgentProfileInput = {
    where: AgentWhereUniqueInput
    data: XOR<AgentUpdateWithoutAgentProfileInput, AgentUncheckedUpdateWithoutAgentProfileInput>
  }

  export type AgentUpdateManyWithWhereWithoutAgentProfileInput = {
    where: AgentScalarWhereInput
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyWithoutAgentProfileInput>
  }

  export type AgentProfileCreateWithoutAgentInput = {
    id?: string
    onchainId: number
    name: string
    xHandle: string
    bio?: AgentProfileCreatebioInput | string[]
    lore?: AgentProfileCreateloreInput | string[]
    characteristics?: AgentProfileCreatecharacteristicsInput | string[]
    knowledge?: AgentProfileCreateknowledgeInput | string[]
    traits: JsonNullValueInput | InputJsonValue
  }

  export type AgentProfileUncheckedCreateWithoutAgentInput = {
    id?: string
    onchainId: number
    name: string
    xHandle: string
    bio?: AgentProfileCreatebioInput | string[]
    lore?: AgentProfileCreateloreInput | string[]
    characteristics?: AgentProfileCreatecharacteristicsInput | string[]
    knowledge?: AgentProfileCreateknowledgeInput | string[]
    traits: JsonNullValueInput | InputJsonValue
  }

  export type AgentProfileCreateOrConnectWithoutAgentInput = {
    where: AgentProfileWhereUniqueInput
    create: XOR<AgentProfileCreateWithoutAgentInput, AgentProfileUncheckedCreateWithoutAgentInput>
  }

  export type GameCreateWithoutAgentsInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    alliances?: AllianceCreateNestedManyWithoutGameInput
    battles?: BattleCreateNestedManyWithoutGameInput
    Cooldown?: CooldownCreateNestedManyWithoutGameInput
  }

  export type GameUncheckedCreateWithoutAgentsInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    alliances?: AllianceUncheckedCreateNestedManyWithoutGameInput
    battles?: BattleUncheckedCreateNestedManyWithoutGameInput
    Cooldown?: CooldownUncheckedCreateNestedManyWithoutGameInput
  }

  export type GameCreateOrConnectWithoutAgentsInput = {
    where: GameWhereUniqueInput
    create: XOR<GameCreateWithoutAgentsInput, GameUncheckedCreateWithoutAgentsInput>
  }

  export type LocationCreateWithoutAgentInput = {
    id?: string
    x: number
    y: number
    terrainType: $Enums.TerrainType
  }

  export type LocationUncheckedCreateWithoutAgentInput = {
    id?: string
    x: number
    y: number
    terrainType: $Enums.TerrainType
  }

  export type LocationCreateOrConnectWithoutAgentInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutAgentInput, LocationUncheckedCreateWithoutAgentInput>
  }

  export type AllianceCreateWithoutAgentInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    game: GameCreateNestedOneWithoutAlliancesInput
    alliedAgent: AgentCreateNestedOneWithoutAlliedByInput
  }

  export type AllianceUncheckedCreateWithoutAgentInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    gameId: string
    alliedAgentId: string
  }

  export type AllianceCreateOrConnectWithoutAgentInput = {
    where: AllianceWhereUniqueInput
    create: XOR<AllianceCreateWithoutAgentInput, AllianceUncheckedCreateWithoutAgentInput>
  }

  export type BattleCreateWithoutAgentInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
    game: GameCreateNestedOneWithoutBattlesInput
    opponent: AgentCreateNestedOneWithoutBattlesAsOpponentInput
  }

  export type BattleUncheckedCreateWithoutAgentInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    gameId: string
    opponentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type BattleCreateOrConnectWithoutAgentInput = {
    where: BattleWhereUniqueInput
    create: XOR<BattleCreateWithoutAgentInput, BattleUncheckedCreateWithoutAgentInput>
  }

  export type BattleCreateManyAgentInputEnvelope = {
    data: BattleCreateManyAgentInput | BattleCreateManyAgentInput[]
    skipDuplicates?: boolean
  }

  export type AgentStateCreateWithoutAgentInput = {
    id?: string
    isAlive?: boolean
    lastActionType: string
    lastActionTime?: Date | string
    lastActionDetails: string
    influencedByTweet?: string | null
    influenceScore?: number
  }

  export type AgentStateUncheckedCreateWithoutAgentInput = {
    id?: string
    isAlive?: boolean
    lastActionType: string
    lastActionTime?: Date | string
    lastActionDetails: string
    influencedByTweet?: string | null
    influenceScore?: number
  }

  export type AgentStateCreateOrConnectWithoutAgentInput = {
    where: AgentStateWhereUniqueInput
    create: XOR<AgentStateCreateWithoutAgentInput, AgentStateUncheckedCreateWithoutAgentInput>
  }

  export type StrategyCreateWithoutAgentInput = {
    id?: string
    publicStrategy: string
    actualStrategy: string
    deceptionLevel: number
  }

  export type StrategyUncheckedCreateWithoutAgentInput = {
    id?: string
    publicStrategy: string
    actualStrategy: string
    deceptionLevel: number
  }

  export type StrategyCreateOrConnectWithoutAgentInput = {
    where: StrategyWhereUniqueInput
    create: XOR<StrategyCreateWithoutAgentInput, StrategyUncheckedCreateWithoutAgentInput>
  }

  export type CooldownCreateWithoutAgentInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    targetAgentId?: string | null
    game: GameCreateNestedOneWithoutCooldownInput
  }

  export type CooldownUncheckedCreateWithoutAgentInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    targetAgentId?: string | null
    gameId: string
  }

  export type CooldownCreateOrConnectWithoutAgentInput = {
    where: CooldownWhereUniqueInput
    create: XOR<CooldownCreateWithoutAgentInput, CooldownUncheckedCreateWithoutAgentInput>
  }

  export type CooldownCreateManyAgentInputEnvelope = {
    data: CooldownCreateManyAgentInput | CooldownCreateManyAgentInput[]
    skipDuplicates?: boolean
  }

  export type AllianceCreateWithoutAlliedAgentInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    game: GameCreateNestedOneWithoutAlliancesInput
    agent: AgentCreateNestedOneWithoutCurrentAllianceInput
  }

  export type AllianceUncheckedCreateWithoutAlliedAgentInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    gameId: string
    agentId: string
  }

  export type AllianceCreateOrConnectWithoutAlliedAgentInput = {
    where: AllianceWhereUniqueInput
    create: XOR<AllianceCreateWithoutAlliedAgentInput, AllianceUncheckedCreateWithoutAlliedAgentInput>
  }

  export type AllianceCreateManyAlliedAgentInputEnvelope = {
    data: AllianceCreateManyAlliedAgentInput | AllianceCreateManyAlliedAgentInput[]
    skipDuplicates?: boolean
  }

  export type BattleCreateWithoutOpponentInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
    game: GameCreateNestedOneWithoutBattlesInput
    agent: AgentCreateNestedOneWithoutBattlesInput
  }

  export type BattleUncheckedCreateWithoutOpponentInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    gameId: string
    agentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type BattleCreateOrConnectWithoutOpponentInput = {
    where: BattleWhereUniqueInput
    create: XOR<BattleCreateWithoutOpponentInput, BattleUncheckedCreateWithoutOpponentInput>
  }

  export type BattleCreateManyOpponentInputEnvelope = {
    data: BattleCreateManyOpponentInput | BattleCreateManyOpponentInput[]
    skipDuplicates?: boolean
  }

  export type TweetCreateWithoutAgentInput = {
    id?: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
    interactions?: InteractionCreateNestedManyWithoutTweetInput
  }

  export type TweetUncheckedCreateWithoutAgentInput = {
    id?: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
    interactions?: InteractionUncheckedCreateNestedManyWithoutTweetInput
  }

  export type TweetCreateOrConnectWithoutAgentInput = {
    where: TweetWhereUniqueInput
    create: XOR<TweetCreateWithoutAgentInput, TweetUncheckedCreateWithoutAgentInput>
  }

  export type TweetCreateManyAgentInputEnvelope = {
    data: TweetCreateManyAgentInput | TweetCreateManyAgentInput[]
    skipDuplicates?: boolean
  }

  export type AgentProfileUpsertWithoutAgentInput = {
    update: XOR<AgentProfileUpdateWithoutAgentInput, AgentProfileUncheckedUpdateWithoutAgentInput>
    create: XOR<AgentProfileCreateWithoutAgentInput, AgentProfileUncheckedCreateWithoutAgentInput>
    where?: AgentProfileWhereInput
  }

  export type AgentProfileUpdateToOneWithWhereWithoutAgentInput = {
    where?: AgentProfileWhereInput
    data: XOR<AgentProfileUpdateWithoutAgentInput, AgentProfileUncheckedUpdateWithoutAgentInput>
  }

  export type AgentProfileUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    onchainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    xHandle?: StringFieldUpdateOperationsInput | string
    bio?: AgentProfileUpdatebioInput | string[]
    lore?: AgentProfileUpdateloreInput | string[]
    characteristics?: AgentProfileUpdatecharacteristicsInput | string[]
    knowledge?: AgentProfileUpdateknowledgeInput | string[]
    traits?: JsonNullValueInput | InputJsonValue
  }

  export type AgentProfileUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    onchainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    xHandle?: StringFieldUpdateOperationsInput | string
    bio?: AgentProfileUpdatebioInput | string[]
    lore?: AgentProfileUpdateloreInput | string[]
    characteristics?: AgentProfileUpdatecharacteristicsInput | string[]
    knowledge?: AgentProfileUpdateknowledgeInput | string[]
    traits?: JsonNullValueInput | InputJsonValue
  }

  export type GameUpsertWithoutAgentsInput = {
    update: XOR<GameUpdateWithoutAgentsInput, GameUncheckedUpdateWithoutAgentsInput>
    create: XOR<GameCreateWithoutAgentsInput, GameUncheckedCreateWithoutAgentsInput>
    where?: GameWhereInput
  }

  export type GameUpdateToOneWithWhereWithoutAgentsInput = {
    where?: GameWhereInput
    data: XOR<GameUpdateWithoutAgentsInput, GameUncheckedUpdateWithoutAgentsInput>
  }

  export type GameUpdateWithoutAgentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    alliances?: AllianceUpdateManyWithoutGameNestedInput
    battles?: BattleUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateWithoutAgentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    alliances?: AllianceUncheckedUpdateManyWithoutGameNestedInput
    battles?: BattleUncheckedUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUncheckedUpdateManyWithoutGameNestedInput
  }

  export type LocationUpsertWithoutAgentInput = {
    update: XOR<LocationUpdateWithoutAgentInput, LocationUncheckedUpdateWithoutAgentInput>
    create: XOR<LocationCreateWithoutAgentInput, LocationUncheckedCreateWithoutAgentInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutAgentInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutAgentInput, LocationUncheckedUpdateWithoutAgentInput>
  }

  export type LocationUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    x?: IntFieldUpdateOperationsInput | number
    y?: IntFieldUpdateOperationsInput | number
    terrainType?: EnumTerrainTypeFieldUpdateOperationsInput | $Enums.TerrainType
  }

  export type LocationUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    x?: IntFieldUpdateOperationsInput | number
    y?: IntFieldUpdateOperationsInput | number
    terrainType?: EnumTerrainTypeFieldUpdateOperationsInput | $Enums.TerrainType
  }

  export type AllianceUpsertWithoutAgentInput = {
    update: XOR<AllianceUpdateWithoutAgentInput, AllianceUncheckedUpdateWithoutAgentInput>
    create: XOR<AllianceCreateWithoutAgentInput, AllianceUncheckedCreateWithoutAgentInput>
    where?: AllianceWhereInput
  }

  export type AllianceUpdateToOneWithWhereWithoutAgentInput = {
    where?: AllianceWhereInput
    data: XOR<AllianceUpdateWithoutAgentInput, AllianceUncheckedUpdateWithoutAgentInput>
  }

  export type AllianceUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    game?: GameUpdateOneRequiredWithoutAlliancesNestedInput
    alliedAgent?: AgentUpdateOneRequiredWithoutAlliedByNestedInput
  }

  export type AllianceUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    gameId?: StringFieldUpdateOperationsInput | string
    alliedAgentId?: StringFieldUpdateOperationsInput | string
  }

  export type BattleUpsertWithWhereUniqueWithoutAgentInput = {
    where: BattleWhereUniqueInput
    update: XOR<BattleUpdateWithoutAgentInput, BattleUncheckedUpdateWithoutAgentInput>
    create: XOR<BattleCreateWithoutAgentInput, BattleUncheckedCreateWithoutAgentInput>
  }

  export type BattleUpdateWithWhereUniqueWithoutAgentInput = {
    where: BattleWhereUniqueInput
    data: XOR<BattleUpdateWithoutAgentInput, BattleUncheckedUpdateWithoutAgentInput>
  }

  export type BattleUpdateManyWithWhereWithoutAgentInput = {
    where: BattleScalarWhereInput
    data: XOR<BattleUpdateManyMutationInput, BattleUncheckedUpdateManyWithoutAgentInput>
  }

  export type AgentStateUpsertWithoutAgentInput = {
    update: XOR<AgentStateUpdateWithoutAgentInput, AgentStateUncheckedUpdateWithoutAgentInput>
    create: XOR<AgentStateCreateWithoutAgentInput, AgentStateUncheckedCreateWithoutAgentInput>
    where?: AgentStateWhereInput
  }

  export type AgentStateUpdateToOneWithWhereWithoutAgentInput = {
    where?: AgentStateWhereInput
    data: XOR<AgentStateUpdateWithoutAgentInput, AgentStateUncheckedUpdateWithoutAgentInput>
  }

  export type AgentStateUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    isAlive?: BoolFieldUpdateOperationsInput | boolean
    lastActionType?: StringFieldUpdateOperationsInput | string
    lastActionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActionDetails?: StringFieldUpdateOperationsInput | string
    influencedByTweet?: NullableStringFieldUpdateOperationsInput | string | null
    influenceScore?: FloatFieldUpdateOperationsInput | number
  }

  export type AgentStateUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    isAlive?: BoolFieldUpdateOperationsInput | boolean
    lastActionType?: StringFieldUpdateOperationsInput | string
    lastActionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActionDetails?: StringFieldUpdateOperationsInput | string
    influencedByTweet?: NullableStringFieldUpdateOperationsInput | string | null
    influenceScore?: FloatFieldUpdateOperationsInput | number
  }

  export type StrategyUpsertWithoutAgentInput = {
    update: XOR<StrategyUpdateWithoutAgentInput, StrategyUncheckedUpdateWithoutAgentInput>
    create: XOR<StrategyCreateWithoutAgentInput, StrategyUncheckedCreateWithoutAgentInput>
    where?: StrategyWhereInput
  }

  export type StrategyUpdateToOneWithWhereWithoutAgentInput = {
    where?: StrategyWhereInput
    data: XOR<StrategyUpdateWithoutAgentInput, StrategyUncheckedUpdateWithoutAgentInput>
  }

  export type StrategyUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    publicStrategy?: StringFieldUpdateOperationsInput | string
    actualStrategy?: StringFieldUpdateOperationsInput | string
    deceptionLevel?: IntFieldUpdateOperationsInput | number
  }

  export type StrategyUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    publicStrategy?: StringFieldUpdateOperationsInput | string
    actualStrategy?: StringFieldUpdateOperationsInput | string
    deceptionLevel?: IntFieldUpdateOperationsInput | number
  }

  export type CooldownUpsertWithWhereUniqueWithoutAgentInput = {
    where: CooldownWhereUniqueInput
    update: XOR<CooldownUpdateWithoutAgentInput, CooldownUncheckedUpdateWithoutAgentInput>
    create: XOR<CooldownCreateWithoutAgentInput, CooldownUncheckedCreateWithoutAgentInput>
  }

  export type CooldownUpdateWithWhereUniqueWithoutAgentInput = {
    where: CooldownWhereUniqueInput
    data: XOR<CooldownUpdateWithoutAgentInput, CooldownUncheckedUpdateWithoutAgentInput>
  }

  export type CooldownUpdateManyWithWhereWithoutAgentInput = {
    where: CooldownScalarWhereInput
    data: XOR<CooldownUpdateManyMutationInput, CooldownUncheckedUpdateManyWithoutAgentInput>
  }

  export type AllianceUpsertWithWhereUniqueWithoutAlliedAgentInput = {
    where: AllianceWhereUniqueInput
    update: XOR<AllianceUpdateWithoutAlliedAgentInput, AllianceUncheckedUpdateWithoutAlliedAgentInput>
    create: XOR<AllianceCreateWithoutAlliedAgentInput, AllianceUncheckedCreateWithoutAlliedAgentInput>
  }

  export type AllianceUpdateWithWhereUniqueWithoutAlliedAgentInput = {
    where: AllianceWhereUniqueInput
    data: XOR<AllianceUpdateWithoutAlliedAgentInput, AllianceUncheckedUpdateWithoutAlliedAgentInput>
  }

  export type AllianceUpdateManyWithWhereWithoutAlliedAgentInput = {
    where: AllianceScalarWhereInput
    data: XOR<AllianceUpdateManyMutationInput, AllianceUncheckedUpdateManyWithoutAlliedAgentInput>
  }

  export type BattleUpsertWithWhereUniqueWithoutOpponentInput = {
    where: BattleWhereUniqueInput
    update: XOR<BattleUpdateWithoutOpponentInput, BattleUncheckedUpdateWithoutOpponentInput>
    create: XOR<BattleCreateWithoutOpponentInput, BattleUncheckedCreateWithoutOpponentInput>
  }

  export type BattleUpdateWithWhereUniqueWithoutOpponentInput = {
    where: BattleWhereUniqueInput
    data: XOR<BattleUpdateWithoutOpponentInput, BattleUncheckedUpdateWithoutOpponentInput>
  }

  export type BattleUpdateManyWithWhereWithoutOpponentInput = {
    where: BattleScalarWhereInput
    data: XOR<BattleUpdateManyMutationInput, BattleUncheckedUpdateManyWithoutOpponentInput>
  }

  export type TweetUpsertWithWhereUniqueWithoutAgentInput = {
    where: TweetWhereUniqueInput
    update: XOR<TweetUpdateWithoutAgentInput, TweetUncheckedUpdateWithoutAgentInput>
    create: XOR<TweetCreateWithoutAgentInput, TweetUncheckedCreateWithoutAgentInput>
  }

  export type TweetUpdateWithWhereUniqueWithoutAgentInput = {
    where: TweetWhereUniqueInput
    data: XOR<TweetUpdateWithoutAgentInput, TweetUncheckedUpdateWithoutAgentInput>
  }

  export type TweetUpdateManyWithWhereWithoutAgentInput = {
    where: TweetScalarWhereInput
    data: XOR<TweetUpdateManyMutationInput, TweetUncheckedUpdateManyWithoutAgentInput>
  }

  export type TweetScalarWhereInput = {
    AND?: TweetScalarWhereInput | TweetScalarWhereInput[]
    OR?: TweetScalarWhereInput[]
    NOT?: TweetScalarWhereInput | TweetScalarWhereInput[]
    id?: StringFilter<"Tweet"> | string
    agentId?: StringFilter<"Tweet"> | string
    content?: StringFilter<"Tweet"> | string
    type?: StringFilter<"Tweet"> | string
    timestamp?: DateTimeFilter<"Tweet"> | Date | string
    conversationId?: StringNullableFilter<"Tweet"> | string | null
  }

  export type AgentCreateWithoutTweetInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
  }

  export type AgentUncheckedCreateWithoutTweetInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
  }

  export type AgentCreateOrConnectWithoutTweetInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutTweetInput, AgentUncheckedCreateWithoutTweetInput>
  }

  export type InteractionCreateWithoutTweetInput = {
    id?: string
    userId: string
    type: string
    content?: string | null
    timestamp: Date | string
    userMetrics: JsonNullValueInput | InputJsonValue
  }

  export type InteractionUncheckedCreateWithoutTweetInput = {
    id?: string
    userId: string
    type: string
    content?: string | null
    timestamp: Date | string
    userMetrics: JsonNullValueInput | InputJsonValue
  }

  export type InteractionCreateOrConnectWithoutTweetInput = {
    where: InteractionWhereUniqueInput
    create: XOR<InteractionCreateWithoutTweetInput, InteractionUncheckedCreateWithoutTweetInput>
  }

  export type InteractionCreateManyTweetInputEnvelope = {
    data: InteractionCreateManyTweetInput | InteractionCreateManyTweetInput[]
    skipDuplicates?: boolean
  }

  export type AgentUpsertWithoutTweetInput = {
    update: XOR<AgentUpdateWithoutTweetInput, AgentUncheckedUpdateWithoutTweetInput>
    create: XOR<AgentCreateWithoutTweetInput, AgentUncheckedCreateWithoutTweetInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutTweetInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutTweetInput, AgentUncheckedUpdateWithoutTweetInput>
  }

  export type AgentUpdateWithoutTweetInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
  }

  export type AgentUncheckedUpdateWithoutTweetInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
  }

  export type InteractionUpsertWithWhereUniqueWithoutTweetInput = {
    where: InteractionWhereUniqueInput
    update: XOR<InteractionUpdateWithoutTweetInput, InteractionUncheckedUpdateWithoutTweetInput>
    create: XOR<InteractionCreateWithoutTweetInput, InteractionUncheckedCreateWithoutTweetInput>
  }

  export type InteractionUpdateWithWhereUniqueWithoutTweetInput = {
    where: InteractionWhereUniqueInput
    data: XOR<InteractionUpdateWithoutTweetInput, InteractionUncheckedUpdateWithoutTweetInput>
  }

  export type InteractionUpdateManyWithWhereWithoutTweetInput = {
    where: InteractionScalarWhereInput
    data: XOR<InteractionUpdateManyMutationInput, InteractionUncheckedUpdateManyWithoutTweetInput>
  }

  export type InteractionScalarWhereInput = {
    AND?: InteractionScalarWhereInput | InteractionScalarWhereInput[]
    OR?: InteractionScalarWhereInput[]
    NOT?: InteractionScalarWhereInput | InteractionScalarWhereInput[]
    id?: StringFilter<"Interaction"> | string
    tweetId?: StringFilter<"Interaction"> | string
    userId?: StringFilter<"Interaction"> | string
    type?: StringFilter<"Interaction"> | string
    content?: StringNullableFilter<"Interaction"> | string | null
    timestamp?: DateTimeFilter<"Interaction"> | Date | string
    userMetrics?: JsonFilter<"Interaction">
  }

  export type AgentCreateWithoutLocationInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutLocationInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutLocationInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutLocationInput, AgentUncheckedCreateWithoutLocationInput>
  }

  export type AgentUpsertWithoutLocationInput = {
    update: XOR<AgentUpdateWithoutLocationInput, AgentUncheckedUpdateWithoutLocationInput>
    create: XOR<AgentCreateWithoutLocationInput, AgentUncheckedCreateWithoutLocationInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutLocationInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutLocationInput, AgentUncheckedUpdateWithoutLocationInput>
  }

  export type AgentUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type GameCreateWithoutAlliancesInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentCreateNestedManyWithoutGameInput
    battles?: BattleCreateNestedManyWithoutGameInput
    Cooldown?: CooldownCreateNestedManyWithoutGameInput
  }

  export type GameUncheckedCreateWithoutAlliancesInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentUncheckedCreateNestedManyWithoutGameInput
    battles?: BattleUncheckedCreateNestedManyWithoutGameInput
    Cooldown?: CooldownUncheckedCreateNestedManyWithoutGameInput
  }

  export type GameCreateOrConnectWithoutAlliancesInput = {
    where: GameWhereUniqueInput
    create: XOR<GameCreateWithoutAlliancesInput, GameUncheckedCreateWithoutAlliancesInput>
  }

  export type AgentCreateWithoutCurrentAllianceInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutCurrentAllianceInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutCurrentAllianceInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutCurrentAllianceInput, AgentUncheckedCreateWithoutCurrentAllianceInput>
  }

  export type AgentCreateWithoutAlliedByInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutAlliedByInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutAlliedByInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutAlliedByInput, AgentUncheckedCreateWithoutAlliedByInput>
  }

  export type GameUpsertWithoutAlliancesInput = {
    update: XOR<GameUpdateWithoutAlliancesInput, GameUncheckedUpdateWithoutAlliancesInput>
    create: XOR<GameCreateWithoutAlliancesInput, GameUncheckedCreateWithoutAlliancesInput>
    where?: GameWhereInput
  }

  export type GameUpdateToOneWithWhereWithoutAlliancesInput = {
    where?: GameWhereInput
    data: XOR<GameUpdateWithoutAlliancesInput, GameUncheckedUpdateWithoutAlliancesInput>
  }

  export type GameUpdateWithoutAlliancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUpdateManyWithoutGameNestedInput
    battles?: BattleUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateWithoutAlliancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUncheckedUpdateManyWithoutGameNestedInput
    battles?: BattleUncheckedUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUncheckedUpdateManyWithoutGameNestedInput
  }

  export type AgentUpsertWithoutCurrentAllianceInput = {
    update: XOR<AgentUpdateWithoutCurrentAllianceInput, AgentUncheckedUpdateWithoutCurrentAllianceInput>
    create: XOR<AgentCreateWithoutCurrentAllianceInput, AgentUncheckedCreateWithoutCurrentAllianceInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutCurrentAllianceInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutCurrentAllianceInput, AgentUncheckedUpdateWithoutCurrentAllianceInput>
  }

  export type AgentUpdateWithoutCurrentAllianceInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutCurrentAllianceInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentUpsertWithoutAlliedByInput = {
    update: XOR<AgentUpdateWithoutAlliedByInput, AgentUncheckedUpdateWithoutAlliedByInput>
    create: XOR<AgentCreateWithoutAlliedByInput, AgentUncheckedCreateWithoutAlliedByInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutAlliedByInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutAlliedByInput, AgentUncheckedUpdateWithoutAlliedByInput>
  }

  export type AgentUpdateWithoutAlliedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutAlliedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type GameCreateWithoutBattlesInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentCreateNestedManyWithoutGameInput
    alliances?: AllianceCreateNestedManyWithoutGameInput
    Cooldown?: CooldownCreateNestedManyWithoutGameInput
  }

  export type GameUncheckedCreateWithoutBattlesInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentUncheckedCreateNestedManyWithoutGameInput
    alliances?: AllianceUncheckedCreateNestedManyWithoutGameInput
    Cooldown?: CooldownUncheckedCreateNestedManyWithoutGameInput
  }

  export type GameCreateOrConnectWithoutBattlesInput = {
    where: GameWhereUniqueInput
    create: XOR<GameCreateWithoutBattlesInput, GameUncheckedCreateWithoutBattlesInput>
  }

  export type AgentCreateWithoutBattlesInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutBattlesInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutBattlesInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutBattlesInput, AgentUncheckedCreateWithoutBattlesInput>
  }

  export type AgentCreateWithoutBattlesAsOpponentInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutBattlesAsOpponentInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutBattlesAsOpponentInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutBattlesAsOpponentInput, AgentUncheckedCreateWithoutBattlesAsOpponentInput>
  }

  export type GameUpsertWithoutBattlesInput = {
    update: XOR<GameUpdateWithoutBattlesInput, GameUncheckedUpdateWithoutBattlesInput>
    create: XOR<GameCreateWithoutBattlesInput, GameUncheckedCreateWithoutBattlesInput>
    where?: GameWhereInput
  }

  export type GameUpdateToOneWithWhereWithoutBattlesInput = {
    where?: GameWhereInput
    data: XOR<GameUpdateWithoutBattlesInput, GameUncheckedUpdateWithoutBattlesInput>
  }

  export type GameUpdateWithoutBattlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUpdateManyWithoutGameNestedInput
    alliances?: AllianceUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateWithoutBattlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUncheckedUpdateManyWithoutGameNestedInput
    alliances?: AllianceUncheckedUpdateManyWithoutGameNestedInput
    Cooldown?: CooldownUncheckedUpdateManyWithoutGameNestedInput
  }

  export type AgentUpsertWithoutBattlesInput = {
    update: XOR<AgentUpdateWithoutBattlesInput, AgentUncheckedUpdateWithoutBattlesInput>
    create: XOR<AgentCreateWithoutBattlesInput, AgentUncheckedCreateWithoutBattlesInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutBattlesInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutBattlesInput, AgentUncheckedUpdateWithoutBattlesInput>
  }

  export type AgentUpdateWithoutBattlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutBattlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentUpsertWithoutBattlesAsOpponentInput = {
    update: XOR<AgentUpdateWithoutBattlesAsOpponentInput, AgentUncheckedUpdateWithoutBattlesAsOpponentInput>
    create: XOR<AgentCreateWithoutBattlesAsOpponentInput, AgentUncheckedCreateWithoutBattlesAsOpponentInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutBattlesAsOpponentInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutBattlesAsOpponentInput, AgentUncheckedUpdateWithoutBattlesAsOpponentInput>
  }

  export type AgentUpdateWithoutBattlesAsOpponentInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutBattlesAsOpponentInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type TweetCreateWithoutInteractionsInput = {
    id?: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
    agent: AgentCreateNestedOneWithoutTweetInput
  }

  export type TweetUncheckedCreateWithoutInteractionsInput = {
    id?: string
    agentId: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
  }

  export type TweetCreateOrConnectWithoutInteractionsInput = {
    where: TweetWhereUniqueInput
    create: XOR<TweetCreateWithoutInteractionsInput, TweetUncheckedCreateWithoutInteractionsInput>
  }

  export type TweetUpsertWithoutInteractionsInput = {
    update: XOR<TweetUpdateWithoutInteractionsInput, TweetUncheckedUpdateWithoutInteractionsInput>
    create: XOR<TweetCreateWithoutInteractionsInput, TweetUncheckedCreateWithoutInteractionsInput>
    where?: TweetWhereInput
  }

  export type TweetUpdateToOneWithWhereWithoutInteractionsInput = {
    where?: TweetWhereInput
    data: XOR<TweetUpdateWithoutInteractionsInput, TweetUncheckedUpdateWithoutInteractionsInput>
  }

  export type TweetUpdateWithoutInteractionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    agent?: AgentUpdateOneRequiredWithoutTweetNestedInput
  }

  export type TweetUncheckedUpdateWithoutInteractionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AgentCreateWithoutStateInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutStateInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutStateInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutStateInput, AgentUncheckedCreateWithoutStateInput>
  }

  export type AgentUpsertWithoutStateInput = {
    update: XOR<AgentUpdateWithoutStateInput, AgentUncheckedUpdateWithoutStateInput>
    create: XOR<AgentCreateWithoutStateInput, AgentUncheckedCreateWithoutStateInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutStateInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutStateInput, AgentUncheckedUpdateWithoutStateInput>
  }

  export type AgentUpdateWithoutStateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutStateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentCreateWithoutCooldownsInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    strategy?: StrategyCreateNestedOneWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutCooldownsInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    strategy?: StrategyUncheckedCreateNestedOneWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutCooldownsInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutCooldownsInput, AgentUncheckedCreateWithoutCooldownsInput>
  }

  export type GameCreateWithoutCooldownInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentCreateNestedManyWithoutGameInput
    alliances?: AllianceCreateNestedManyWithoutGameInput
    battles?: BattleCreateNestedManyWithoutGameInput
  }

  export type GameUncheckedCreateWithoutCooldownInput = {
    id?: string
    gameId: bigint | number
    authority: string
    tokenMint: string
    rewardsVault: string
    mapDiameter: number
    isActive?: boolean
    lastUpdate?: Date | string
    bump: number
    dailyRewardTokens: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentUncheckedCreateNestedManyWithoutGameInput
    alliances?: AllianceUncheckedCreateNestedManyWithoutGameInput
    battles?: BattleUncheckedCreateNestedManyWithoutGameInput
  }

  export type GameCreateOrConnectWithoutCooldownInput = {
    where: GameWhereUniqueInput
    create: XOR<GameCreateWithoutCooldownInput, GameUncheckedCreateWithoutCooldownInput>
  }

  export type AgentUpsertWithoutCooldownsInput = {
    update: XOR<AgentUpdateWithoutCooldownsInput, AgentUncheckedUpdateWithoutCooldownsInput>
    create: XOR<AgentCreateWithoutCooldownsInput, AgentUncheckedCreateWithoutCooldownsInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutCooldownsInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutCooldownsInput, AgentUncheckedUpdateWithoutCooldownsInput>
  }

  export type AgentUpdateWithoutCooldownsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutCooldownsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type GameUpsertWithoutCooldownInput = {
    update: XOR<GameUpdateWithoutCooldownInput, GameUncheckedUpdateWithoutCooldownInput>
    create: XOR<GameCreateWithoutCooldownInput, GameUncheckedCreateWithoutCooldownInput>
    where?: GameWhereInput
  }

  export type GameUpdateToOneWithWhereWithoutCooldownInput = {
    where?: GameWhereInput
    data: XOR<GameUpdateWithoutCooldownInput, GameUncheckedUpdateWithoutCooldownInput>
  }

  export type GameUpdateWithoutCooldownInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUpdateManyWithoutGameNestedInput
    alliances?: AllianceUpdateManyWithoutGameNestedInput
    battles?: BattleUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateWithoutCooldownInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: BigIntFieldUpdateOperationsInput | bigint | number
    authority?: StringFieldUpdateOperationsInput | string
    tokenMint?: StringFieldUpdateOperationsInput | string
    rewardsVault?: StringFieldUpdateOperationsInput | string
    mapDiameter?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastUpdate?: DateTimeFieldUpdateOperationsInput | Date | string
    bump?: IntFieldUpdateOperationsInput | number
    dailyRewardTokens?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUncheckedUpdateManyWithoutGameNestedInput
    alliances?: AllianceUncheckedUpdateManyWithoutGameNestedInput
    battles?: BattleUncheckedUpdateManyWithoutGameNestedInput
  }

  export type AgentCreateWithoutStrategyInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    agentProfile: AgentProfileCreateNestedOneWithoutAgentInput
    game: GameCreateNestedOneWithoutAgentsInput
    location?: LocationCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceCreateNestedOneWithoutAgentInput
    battles?: BattleCreateNestedManyWithoutAgentInput
    state?: AgentStateCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleCreateNestedManyWithoutOpponentInput
    Tweet?: TweetCreateNestedManyWithoutAgentInput
  }

  export type AgentUncheckedCreateWithoutStrategyInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
    location?: LocationUncheckedCreateNestedOneWithoutAgentInput
    currentAlliance?: AllianceUncheckedCreateNestedOneWithoutAgentInput
    battles?: BattleUncheckedCreateNestedManyWithoutAgentInput
    state?: AgentStateUncheckedCreateNestedOneWithoutAgentInput
    cooldowns?: CooldownUncheckedCreateNestedManyWithoutAgentInput
    alliedBy?: AllianceUncheckedCreateNestedManyWithoutAlliedAgentInput
    battlesAsOpponent?: BattleUncheckedCreateNestedManyWithoutOpponentInput
    Tweet?: TweetUncheckedCreateNestedManyWithoutAgentInput
  }

  export type AgentCreateOrConnectWithoutStrategyInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutStrategyInput, AgentUncheckedCreateWithoutStrategyInput>
  }

  export type AgentUpsertWithoutStrategyInput = {
    update: XOR<AgentUpdateWithoutStrategyInput, AgentUncheckedUpdateWithoutStrategyInput>
    create: XOR<AgentCreateWithoutStrategyInput, AgentUncheckedCreateWithoutStrategyInput>
    where?: AgentWhereInput
  }

  export type AgentUpdateToOneWithWhereWithoutStrategyInput = {
    where?: AgentWhereInput
    data: XOR<AgentUpdateWithoutStrategyInput, AgentUncheckedUpdateWithoutStrategyInput>
  }

  export type AgentUpdateWithoutStrategyInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutStrategyInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentCreateManyGameInput = {
    id?: string
    agentId: number
    publicKey: string
    agentProfileId: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AllianceCreateManyGameInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    agentId: string
    alliedAgentId: string
  }

  export type BattleCreateManyGameInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    agentId: string
    opponentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type CooldownCreateManyGameInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    agentId: string
    targetAgentId?: string | null
  }

  export type AgentUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentProfile?: AgentProfileUpdateOneRequiredWithoutAgentNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateManyWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    agentProfileId?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AllianceUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    agent?: AgentUpdateOneRequiredWithoutCurrentAllianceNestedInput
    alliedAgent?: AgentUpdateOneRequiredWithoutAlliedByNestedInput
  }

  export type AllianceUncheckedUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    agentId?: StringFieldUpdateOperationsInput | string
    alliedAgentId?: StringFieldUpdateOperationsInput | string
  }

  export type AllianceUncheckedUpdateManyWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    agentId?: StringFieldUpdateOperationsInput | string
    alliedAgentId?: StringFieldUpdateOperationsInput | string
  }

  export type BattleUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    agent?: AgentUpdateOneRequiredWithoutBattlesNestedInput
    opponent?: AgentUpdateOneRequiredWithoutBattlesAsOpponentNestedInput
  }

  export type BattleUncheckedUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    agentId?: StringFieldUpdateOperationsInput | string
    opponentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BattleUncheckedUpdateManyWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    agentId?: StringFieldUpdateOperationsInput | string
    opponentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CooldownUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    agent?: AgentUpdateOneRequiredWithoutCooldownsNestedInput
  }

  export type CooldownUncheckedUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentId?: StringFieldUpdateOperationsInput | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CooldownUncheckedUpdateManyWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agentId?: StringFieldUpdateOperationsInput | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AgentCreateManyAgentProfileInput = {
    id?: string
    agentId: number
    publicKey: string
    health?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    gameId: string
  }

  export type AgentUpdateWithoutAgentProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    game?: GameUpdateOneRequiredWithoutAgentsNestedInput
    location?: LocationUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUpdateOneWithoutAgentNestedInput
    battles?: BattleUpdateManyWithoutAgentNestedInput
    state?: AgentStateUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateWithoutAgentProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
    location?: LocationUncheckedUpdateOneWithoutAgentNestedInput
    currentAlliance?: AllianceUncheckedUpdateOneWithoutAgentNestedInput
    battles?: BattleUncheckedUpdateManyWithoutAgentNestedInput
    state?: AgentStateUncheckedUpdateOneWithoutAgentNestedInput
    strategy?: StrategyUncheckedUpdateOneWithoutAgentNestedInput
    cooldowns?: CooldownUncheckedUpdateManyWithoutAgentNestedInput
    alliedBy?: AllianceUncheckedUpdateManyWithoutAlliedAgentNestedInput
    battlesAsOpponent?: BattleUncheckedUpdateManyWithoutOpponentNestedInput
    Tweet?: TweetUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentUncheckedUpdateManyWithoutAgentProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: IntFieldUpdateOperationsInput | number
    publicKey?: StringFieldUpdateOperationsInput | string
    health?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameId?: StringFieldUpdateOperationsInput | string
  }

  export type BattleCreateManyAgentInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    gameId: string
    opponentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type CooldownCreateManyAgentInput = {
    id?: string
    type: $Enums.CooldownType
    endsAt: Date | string
    targetAgentId?: string | null
    gameId: string
  }

  export type AllianceCreateManyAlliedAgentInput = {
    id?: string
    formedAt?: Date | string
    combinedTokens: number
    status?: $Enums.AllianceStatus
    gameId: string
    agentId: string
  }

  export type BattleCreateManyOpponentInput = {
    id?: string
    timestamp?: Date | string
    outcome: string
    tokensLost?: number | null
    tokensGained?: number | null
    probability: number
    gameId: string
    agentId: string
    type?: $Enums.BattleType
    status?: $Enums.BattleStatus
    startTime: Date | string
    resolutionTime: Date | string
    resolvedAt?: Date | string | null
  }

  export type TweetCreateManyAgentInput = {
    id?: string
    content: string
    type: string
    timestamp: Date | string
    conversationId?: string | null
  }

  export type BattleUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    game?: GameUpdateOneRequiredWithoutBattlesNestedInput
    opponent?: AgentUpdateOneRequiredWithoutBattlesAsOpponentNestedInput
  }

  export type BattleUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    gameId?: StringFieldUpdateOperationsInput | string
    opponentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BattleUncheckedUpdateManyWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    gameId?: StringFieldUpdateOperationsInput | string
    opponentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CooldownUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    game?: GameUpdateOneRequiredWithoutCooldownNestedInput
  }

  export type CooldownUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    gameId?: StringFieldUpdateOperationsInput | string
  }

  export type CooldownUncheckedUpdateManyWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumCooldownTypeFieldUpdateOperationsInput | $Enums.CooldownType
    endsAt?: DateTimeFieldUpdateOperationsInput | Date | string
    targetAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    gameId?: StringFieldUpdateOperationsInput | string
  }

  export type AllianceUpdateWithoutAlliedAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    game?: GameUpdateOneRequiredWithoutAlliancesNestedInput
    agent?: AgentUpdateOneRequiredWithoutCurrentAllianceNestedInput
  }

  export type AllianceUncheckedUpdateWithoutAlliedAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type AllianceUncheckedUpdateManyWithoutAlliedAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    formedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    combinedTokens?: FloatFieldUpdateOperationsInput | number
    status?: EnumAllianceStatusFieldUpdateOperationsInput | $Enums.AllianceStatus
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
  }

  export type BattleUpdateWithoutOpponentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    game?: GameUpdateOneRequiredWithoutBattlesNestedInput
    agent?: AgentUpdateOneRequiredWithoutBattlesNestedInput
  }

  export type BattleUncheckedUpdateWithoutOpponentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BattleUncheckedUpdateManyWithoutOpponentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    tokensLost?: NullableFloatFieldUpdateOperationsInput | number | null
    tokensGained?: NullableFloatFieldUpdateOperationsInput | number | null
    probability?: FloatFieldUpdateOperationsInput | number
    gameId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    type?: EnumBattleTypeFieldUpdateOperationsInput | $Enums.BattleType
    status?: EnumBattleStatusFieldUpdateOperationsInput | $Enums.BattleStatus
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolutionTime?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TweetUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    interactions?: InteractionUpdateManyWithoutTweetNestedInput
  }

  export type TweetUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    interactions?: InteractionUncheckedUpdateManyWithoutTweetNestedInput
  }

  export type TweetUncheckedUpdateManyWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type InteractionCreateManyTweetInput = {
    id?: string
    userId: string
    type: string
    content?: string | null
    timestamp: Date | string
    userMetrics: JsonNullValueInput | InputJsonValue
  }

  export type InteractionUpdateWithoutTweetInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    userMetrics?: JsonNullValueInput | InputJsonValue
  }

  export type InteractionUncheckedUpdateWithoutTweetInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    userMetrics?: JsonNullValueInput | InputJsonValue
  }

  export type InteractionUncheckedUpdateManyWithoutTweetInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    userMetrics?: JsonNullValueInput | InputJsonValue
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}