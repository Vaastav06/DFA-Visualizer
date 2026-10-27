/**
 * Zoom / pan / fit / reset / image export controls for a graph.
 *
 * Wired to the React Flow instance (`useReactFlow`), with fallback to custom handlers.
 *
 * Controls: zoom in, zoom out, fit to view, reset, export PNG and JPEG.
 * Every control is an accessible <button> with keyboard support.
 */

import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { GRAPH_COLORS } from '../graphColors';

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onReset?: () => void;
  onExport?: (format: 'png' | 'jpeg') => void;
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

  const exportImage = async (
    format: 'png' | 'jpeg',
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (onExport) {
      onExport(format);
      return;
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Find the enclosing graph figure and its React Flow canvas
    const graphFigure = event.currentTarget.closest('.automata-graph');
    const canvas = graphFigure?.querySelector('.react-flow') as HTMLElement | null;
    if (!canvas) return;

    try {
      // Normalize markers: ensure all SVG marker elements have concrete fill and stroke colors
      const markers = canvas.querySelectorAll('marker');
      markers.forEach((marker) => {
        const shape = marker.querySelector('polyline, path, polygon');
        if (shape) {
          const markerId = marker.id || '';
          const shapeColor =
            markerId.includes('highlight') || markerId.includes('warning')
              ? GRAPH_COLORS.edgeHighlight
              : GRAPH_COLORS.edge;
          shape.setAttribute('fill', shapeColor);
          shape.setAttribute('stroke', shapeColor);
        }
      });

      const { toPng, toJpeg } = await import('html-to-image');
      const exportFn = format === 'jpeg' ? toJpeg : toPng;
      const dataUrl = await exportFn(canvas, {
        backgroundColor: GRAPH_COLORS.exportBackground,
        pixelRatio: 3, // 3x ultra-sharp resolution for crisp vector lines and text
        quality: 0.98,
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains('automata-graph__footer') ||
              node.classList.contains('react-flow__panel') ||
              node.classList.contains('react-flow__attribution'))
          ) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.warn(`Failed to export diagram as ${format.toUpperCase()}`, error);
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
        onClick={(e) => exportImage('png', e)}
        aria-label="Export diagram as PNG"
        title="Export as PNG image"
      >
        PNG
      </button>
      <button
        type="button"
        onClick={(e) => exportImage('jpeg', e)}
        aria-label="Export diagram as JPEG"
        title="Export as JPEG image"
      >
        JPEG
      </button>
    </div>
  );
}
