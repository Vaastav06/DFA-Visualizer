/**
 * Zoom / pan / fit / reset / PNG export controls for a graph.
 *
 * OWNER: Person 2.
 * Wired to the React Flow instance (`useReactFlow`), with fallback to custom handlers.
 *
 * Controls: zoom in, zoom out, fit to view, reset, export PNG.
 * Every control is an accessible <button> with keyboard support.
 */

import React from 'react';
import { useReactFlow } from '@xyflow/react';

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  filename?: string;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onReset,
  onExport,
  filename = 'automaton-diagram',
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

  const handleExport = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onExport) {
      onExport();
      return;
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Find the enclosing graph figure and its React Flow canvas
    const graphFigure = event.currentTarget.closest('.automata-graph');
    const canvas = graphFigure?.querySelector('.react-flow') as HTMLElement | null;
    if (!canvas) return;

    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(canvas, {
        backgroundColor: '#ffffff',
        pixelRatio: 2, // High resolution (2x) for clear presentation & printing
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('automata-graph__footer')) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.warn('Failed to export diagram as PNG', error);
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
      <button
        type="button"
        onClick={handleExport}
        aria-label="Export diagram as PNG"
        title="Export as high-resolution PNG image"
      >
        Export PNG
      </button>
    </div>
  );
}
