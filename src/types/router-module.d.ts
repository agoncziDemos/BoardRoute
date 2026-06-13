declare module "*/wasm/dist/router.js" {
  export type WasmRouteDemoResult = {
    padCount: number;
    routePointCount: number;
    obstacleCount: number;
    expandedObstacleCount: number;
    metricCount: number;
    pads: Float32Array;
    routePoints: Float32Array;
    obstacles: Float32Array;
    expandedObstacles: Float32Array;
    metrics: Float32Array;
  };

  export type RouterModule = {
    computeDemoRoute(clearance: number, seed: number): WasmRouteDemoResult;
    routeBoard(
      pads: Float32Array,
      obstacles: Float32Array,
      clearance: number,
    ): WasmRouteDemoResult;
  };

  export type RouterModuleOptions = {
    locateFile?: (path: string, prefix: string) => string;
  };

  const createRouterModule: (
    options?: RouterModuleOptions,
  ) => Promise<RouterModule>;

  export default createRouterModule;
}
