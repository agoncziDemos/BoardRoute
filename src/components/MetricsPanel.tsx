import type { RouteResult } from "../routing/routeTypes";

type MetricsPanelProps = {
  route: RouteResult;
};

export function MetricsPanel({ route }: MetricsPanelProps) {
  return (
    <aside className="metricsPanel">
      <h2>Route Metrics</h2>

      <dl>
        <div className="metric">
          <dt>Status</dt>
          <dd>{route.success ? "Success" : "No path"}</dd>
        </div>

        <div className="metric">
          <dt>Length</dt>
          <dd>{route.metrics.length.toFixed(1)}</dd>
        </div>

        <div className="metric">
          <dt>Bends</dt>
          <dd>{route.metrics.bends}</dd>
        </div>

        <div className="metric">
          <dt>Runtime</dt>
          <dd>{route.metrics.runtimeMs.toFixed(3)} ms</dd>
        </div>
      </dl>
    </aside>
  );
}
