import { getCellKey, SpreadVersion, TemplateVersion } from '@aws-spreads-poc/core';

export interface EvaluationContext {
  spread: SpreadVersion;
  template: TemplateVersion;
}

export interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}

const FUNCTION_NAMES = new Set(['IF', 'ABS', 'MIN', 'MAX', 'SUM', 'AVG', 'FLAG']);

export function extractReferences(formula: string): string[] {
  const matches = formula.match(/[A-Z_][A-Z0-9_]*/g) ?? [];
  return [...new Set(matches.filter((token) => !FUNCTION_NAMES.has(token) && token !== 'THEN' && token !== 'ELSE'))];
}

export function buildDependencyGraph(template: TemplateVersion): DependencyGraph {
  const nodes = new Set<string>();
  const edges = new Map<string, Set<string>>();

  for (const section of template.sections) {
    for (const row of section.rows) {
      nodes.add(row.id);
      if (!edges.has(row.id)) edges.set(row.id, new Set<string>());
      if (!row.formula) continue;
      for (const ref of extractReferences(row.formula)) {
        edges.get(row.id)!.add(ref);
      }
    }
  }

  return { nodes, edges };
}

export function detectCycles(graph: DependencyGraph): string[][] {
  const visited = new Set<string>();
  const active = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]) {
    if (active.has(node)) {
      const start = path.indexOf(node);
      cycles.push(path.slice(start).concat(node));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    active.add(node);
    for (const next of graph.edges.get(node) ?? []) dfs(next, [...path, node]);
    active.delete(node);
  }

  for (const node of graph.nodes) dfs(node, []);
  return cycles;
}

export function recalcPeriod(
  context: EvaluationContext,
  periodId: string,
  valueResolver: (ref: string, periodId: string) => number | null
): Record<string, number | null> {
  const outputs: Record<string, number | null> = {};

  for (const section of context.template.sections) {
    for (const row of section.rows) {
      if (!row.formula) continue;
      const expr = row.formula.replace(/[A-Z_][A-Z0-9_]*/g, (token) => {
        if (FUNCTION_NAMES.has(token)) return token;
        const val = outputs[token] ?? valueResolver(token, periodId);
        return String(val ?? '0');
      });

      try {
        const fn = new Function(`return (${expr});`);
        outputs[row.id] = Number(fn());
      } catch {
        outputs[row.id] = null;
      }
    }
  }

  return outputs;
}

export function defaultValueResolver(spread: SpreadVersion): (ref: string, periodId: string) => number | null {
  return (ref: string, periodId: string) => {
    const cell = spread.cells.find((c) => getCellKey(c.rowId, c.periodId) === getCellKey(ref, periodId));
    const num = typeof cell?.normalizedValue === 'number' ? cell.normalizedValue : Number(cell?.normalizedValue ?? NaN);
    return Number.isFinite(num) ? num : null;
  };
}
