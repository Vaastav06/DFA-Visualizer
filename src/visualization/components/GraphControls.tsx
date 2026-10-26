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
  onToggleMiniMap?: () => void;
  isMiniMapVisible?: boolean;
  onExportSvg?: () => void;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onReset,
  onToggleMiniMap,
  isMiniMapVisible = false,
  onExportSvg,
}: GraphControlsProps) {
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

  const handleExport = () => {
    if (onExportSvg) {
      onExportSvg();
      return;
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const svgElem = document.querySelector('.automata-graph .react-flow__viewport');
    if (!svgElem || typeof URL.createObjectURL !== 'function') return;

    try {
      const cloned = svgElem.cloneNode(true) as HTMLElement;
      const svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgWrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgWrapper.setAttribute('width', '1000');
      svgWrapper.setAttribute('height', '600');
      svgWrapper.innerHTML = cloned.innerHTML;
      const svgData = new XMLSerializer().serializeToString(svgWrapper);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'automaton-diagram.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // In constrained environments where XMLSerializer or Blob is unsupported
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
      {onToggleMiniMap && (
        <button
          type="button"
          onClick={onToggleMiniMap}
          aria-label={isMiniMapVisible ? 'Hide minimap' : 'Show minimap'}
          title="Toggle MiniMap"
        >
          {isMiniMapVisible ? 'Map ✓' : 'Map'}
        </button>
      )}
      <button
        type="button"
        onClick={handleExport}
        aria-label="Export diagram as SVG"
        title="Export SVG diagram"
      >
        Export
      </button>
    </div>
  );
}
