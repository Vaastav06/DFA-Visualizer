/**
 * Zoom / pan / fit / reset controls for a graph.
 *
 * OWNER: Person 2.
 * Wired to the React Flow instance (`useReactFlow`), with fallback to custom handlers.
 *
 * Required controls per docs/VISUALIZATION_SPEC.md: zoom in, zoom out, fit to
 * view, reset. Every control must be a real <button> with an accessible label.
 */

import { useReactFlow } from '@xyflow/react';

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onReset?: () => void;
}

export function GraphControls({ onZoomIn, onZoomOut, onFitView, onReset }: GraphControlsProps) {
  const reactFlow = useReactFlow();

  const handleZoomIn = () => {
    if (onZoomIn) {
      onZoomIn();
    } else {
      reactFlow.zoomIn({ duration: 200 });
    }
  };

  const handleZoomOut = () => {
    if (onZoomOut) {
      onZoomOut();
    } else {
      reactFlow.zoomOut({ duration: 200 });
    }
  };

  const handleFitView = () => {
    if (onFitView) {
      onFitView();
    } else {
      reactFlow.fitView({ padding: 0.2, duration: 200 });
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      reactFlow.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
      reactFlow.fitView({ padding: 0.2, duration: 200 });
    }
  };

  return (
    <div className="graph-controls" role="group" aria-label="Graph controls">
      <button type="button" onClick={handleZoomIn} aria-label="Zoom in">
        +
      </button>
      <button type="button" onClick={handleZoomOut} aria-label="Zoom out">
        &minus;
      </button>
      <button type="button" onClick={handleFitView} aria-label="Fit graph to view">
        Fit
      </button>
      <button type="button" onClick={handleReset} aria-label="Reset graph view">
        Reset
      </button>
    </div>
  );
}
