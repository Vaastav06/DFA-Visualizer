import type { DFA, SyntaxNode, SyntaxNodeType } from '../compiler/types';
import type { EdgeRoute } from './layout/edgeRouting';

export const DEAD_STATE_ID = -1;
export type AutomatonKind = 'dfa' | 'syntax-tree';

export interface StateNodeData extends Record<string, unknown> {
  stateId: number;
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  isDeadState?: boolean;
  positions?: number[];
  isHighlighted?: boolean;
  isActive?: boolean;
  isSelected?: boolean;
}

export interface SyntaxTreeNodeData extends Record<string, unknown> {
  nodeId: number;
  type: SyntaxNodeType;
  label: string;
  symbol?: string;
  position?: number;
  nullable: boolean;
  firstpos: number[];
  lastpos: number[];
  isEndMarker?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

export interface TransitionEdgeData extends Record<string, unknown> {
  symbols: string[];
  label: string;
  isEpsilon: false;
  isHighlighted?: boolean;
  route?: EdgeRoute;
}

export interface GraphHighlight {
  states?: number[];
  transitions?: { from: number; to: number; symbol?: string }[];
}

export interface AutomataGraphBaseProps {
  highlight?: GraphHighlight;
  height?: number | string;
  className?: string;
  onStateClick?: (stateId: number, data: StateNodeData) => void;
  selectedStateId?: number | null;
}

export interface DfaGraphProps extends AutomataGraphBaseProps {
  dfa: DFA | null | undefined;
  kind?: 'dfa';
  showDeadState?: boolean;
  activeStateId?: number | null;
  highlightedStateIds?: number[];
  highlightedTransition?: { from: number; to: number; symbol?: string } | null;
}

export interface SyntaxTreeGraphProps {
  tree: SyntaxNode | null | undefined;
  height?: number | string;
  className?: string;
  highlightedPositions?: number[];
  onNodeClick?: (nodeId: number, data: SyntaxTreeNodeData) => void;
  selectedNodeId?: number | null;
}
