export type Position = {
  x: number;
  y: number;
};

import type { MiddleEarthAiProgram } from "@/types/middle_earth_ai_program";

import type * as anchor from "@coral-xyz/anchor";

export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;
