export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Pad = {
  id: string;
  center: Point;
  radius: number;
  netId: string;
};

export type Net = {
  id: string;
  padIds: string[];
};

export type DemoBoard = {
  width: number;
  height: number;
  pads: Pad[];
  nets: Net[];
  obstacles: Rect[];
  expandedObstacles: Rect[];
};

export type RouteMetrics = {  length: number;
  bends: number;
  vias: number;
  violations: number;
  runtimeMs: number;
};

export type RouteResult = {
  success: boolean;
  netId: string;
  points: Point[];
  metrics: RouteMetrics;
};
