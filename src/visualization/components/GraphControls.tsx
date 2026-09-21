/**
 * Zoom / pan / fit / reset controls for a graph.
 *
 * OWNER: Person 2.
 * TODO(Person 2): wire to the React Flow instance (`useReactFlow`).
 *
 * Required controls per docs/VISUALIZATION_SPEC.md: zoom in, zoom out, fit to
 * view, reset. Every control must be a real <button> with an accessible label.
 */

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onReset?: () => void;
}

export function GraphControls({ onZoomIn, onZoomOut, onFitView, onReset }: GraphControlsProps) {
  return (
    <div className="graph-controls" role="group" aria-label="Graph controls">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in">
        +
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out">
        &minus;
      </button>
      <button type="button" onClick={onFitView} aria-label="Fit graph to view">
        Fit
      </button>
      <button type="button" onClick={onReset} aria-label="Reset graph view">
        Reset
      </button>
    </div>
  );
}
