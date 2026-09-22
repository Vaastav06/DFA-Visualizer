/**
 * Tests for syntax tree adapter and layout.
 *
 * OWNER: Person 2.
 */

import { describe, expect, it } from 'vitest';
import { adaptSyntaxTree } from '../../src/visualization/adapters/syntaxTreeAdapter';
import { layoutSyntaxTree } from '../../src/visualization/layout/treeLayout';
import { MOCK_COMPILATION_RESULT } from '../fixtures/mockAutomata';
import type { SyntaxNode } from '../../src/compiler/types';

describe('adaptSyntaxTree', () => {
  it('returns empty nodes and edges for null or undefined tree', () => {
    expect(adaptSyntaxTree(null)).toEqual({ nodes: [], edges: [] });
    expect(adaptSyntaxTree(undefined)).toEqual({ nodes: [], edges: [] });
  });

  it('adapts a single leaf node correctly', () => {
    const singleLeaf: SyntaxNode = {
      id: 1,
      type: 'symbol',
      symbol: 'a',
      position: 1,
      nullable: false,
      firstpos: [1],
      lastpos: [1],
    };

    const adapted = adaptSyntaxTree(singleLeaf);
    expect(adapted.nodes).toHaveLength(1);
    expect(adapted.edges).toHaveLength(0);

    const node = adapted.nodes[0];
    expect(node.id).toBe('1');
    expect(node.data.nodeId).toBe(1);
    expect(node.data.type).toBe('symbol');
    expect(node.data.label).toBe('a');
    expect(node.data.position).toBe(1);
    expect(node.data.nullable).toBe(false);
    expect(node.data.firstpos).toEqual([1]);
    expect(node.data.lastpos).toEqual([1]);
    expect(node.data.isEndMarker).toBe(false);
  });

  it('correctly tags augmented end-marker leaf #', () => {
    const endLeaf: SyntaxNode = {
      id: 2,
      type: 'symbol',
      symbol: '#',
      position: 2,
      nullable: false,
      firstpos: [2],
      lastpos: [2],
    };

    const adapted = adaptSyntaxTree(endLeaf);
    expect(adapted.nodes).toHaveLength(1);
    expect(adapted.nodes[0].data.isEndMarker).toBe(true);
    expect(adapted.nodes[0].data.label).toBe('#');
  });

  it('adapts full MOCK_SYNTAX_TREE with parent-child edges and correct operator labels', () => {
    const tree = MOCK_COMPILATION_RESULT.syntaxTree;
    const adapted = adaptSyntaxTree(tree);

    // MOCK_SYNTAX_TREE has 5 nodes: root concat(5), union(3), leaf a(1), leaf b(2), leaf #(4)
    expect(adapted.nodes).toHaveLength(5);
    expect(adapted.edges).toHaveLength(4);

    const root = adapted.nodes.find((n) => n.id === '5');
    expect(root).toBeDefined();
    expect(root?.data.type).toBe('concat');
    expect(root?.data.label).toBe('•');
    expect(root?.data.nullable).toBe(false);
    expect(root?.data.firstpos).toEqual([1, 2]);
    expect(root?.data.lastpos).toEqual([3]);

    const union = adapted.nodes.find((n) => n.id === '3');
    expect(union).toBeDefined();
    expect(union?.data.type).toBe('union');
    expect(union?.data.label).toBe('|');

    // Check tree edges: root(5) -> union(3) and root(5) -> #(4)
    expect(adapted.edges).toContainEqual(
      expect.objectContaining({ id: 'e5-3', source: '5', target: '3' })
    );
    expect(adapted.edges).toContainEqual(
      expect.objectContaining({ id: 'e5-4', source: '5', target: '4' })
    );
  });

  it('formats star operator node label as *', () => {
    const starTree: SyntaxNode = {
      id: 2,
      type: 'star',
      nullable: true,
      firstpos: [1],
      lastpos: [1],
      left: {
        id: 1,
        type: 'symbol',
        symbol: 'a',
        position: 1,
        nullable: false,
        firstpos: [1],
        lastpos: [1],
      },
    };

    const adapted = adaptSyntaxTree(starTree);
    expect(adapted.nodes).toHaveLength(2);
    expect(adapted.edges).toHaveLength(1);

    const starNode = adapted.nodes.find((n) => n.id === '2');
    expect(starNode?.data.label).toBe('*');
    expect(starNode?.data.nullable).toBe(true);
  });
});

describe('layoutSyntaxTree', () => {
  it('returns empty layout map for null or undefined tree', () => {
    expect(layoutSyntaxTree(null).size).toBe(0);
    expect(layoutSyntaxTree(undefined).size).toBe(0);
  });

  it('positions single node at (startX, startY) with custom or default options', () => {
    const singleNode: SyntaxNode = {
      id: 1,
      type: 'symbol',
      symbol: 'a',
      position: 1,
      nullable: false,
      firstpos: [1],
      lastpos: [1],
    };

    const layoutDefault = layoutSyntaxTree(singleNode);
    expect(layoutDefault.size).toBe(1);
    expect(layoutDefault.get(1)).toEqual({ x: 60, y: 40 });

    const layoutCustom = layoutSyntaxTree(singleNode, { startX: 0, startY: 0 });
    expect(layoutCustom.get(1)).toEqual({ x: 0, y: 0 });
  });

  it('produces deterministic layout with strictly increasing depths and parent centering', () => {
    const tree = MOCK_COMPILATION_RESULT.syntaxTree;
    const layout = layoutSyntaxTree(tree);

    expect(layout.size).toBe(5);

    const rootPos = layout.get(5)!;
    const unionPos = layout.get(3)!;
    const leafAPos = layout.get(1)!;
    const leafBPos = layout.get(2)!;
    const leafHashPos = layout.get(4)!;

    // Root is at initial depth (startY = 40)
    expect(rootPos.y).toBe(40);

    // Children are deeper than root
    expect(unionPos.y).toBeGreaterThan(rootPos.y);
    expect(leafHashPos.y).toBeGreaterThan(rootPos.y);

    // Leaves a and b are at depth 2 (deeper than union at depth 1)
    expect(leafAPos.y).toBeGreaterThan(unionPos.y);
    expect(leafBPos.y).toBeGreaterThan(unionPos.y);

    // Leaves from left to right should have increasing x coordinates
    expect(leafAPos.x).toBeLessThan(leafBPos.x);
    expect(leafBPos.x).toBeLessThan(leafHashPos.x);

    // Parent union (node 3) should be centered over children leaf a and leaf b
    const expectedUnionX = (leafAPos.x + leafBPos.x) / 2;
    expect(unionPos.x).toBeCloseTo(expectedUnionX);

    // Root (node 5) should be centered between union and leaf # (rounded to integer pixels)
    const expectedRootX = (unionPos.x + leafHashPos.x) / 2;
    expect(rootPos.x).toBe(Math.round(expectedRootX));
  });
});
