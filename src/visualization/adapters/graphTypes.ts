import type { StateNodeData, TransitionEdgeData } from '../types';
export interface GraphNode {
  id: string;
  data: StateNodeData;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data: TransitionEdgeData;
}
export interface AdaptedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
