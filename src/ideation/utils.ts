const MOVE_INTERVAL = 60 * 60 * 1000; // 1 hour

export function isWithinCircle(x: number, y: number, mapSize: number): boolean {
  const centerX = Math.sqrt(mapSize) / 2;
  const centerY = Math.sqrt(mapSize) / 2;
  const radius = Math.sqrt(mapSize) / 2;

  return (
    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2) <= Math.pow(radius, 2)
  );
}
// isWithinCircle(1, 1, 689);
export function calculateMoveDelay(terrainType: string): number {
  switch (terrainType) {
    case "MOUNTAIN":
      return 2 * MOVE_INTERVAL;
    case "RIVER":
      return MOVE_INTERVAL;
    default:
      return 0;
  }
}
