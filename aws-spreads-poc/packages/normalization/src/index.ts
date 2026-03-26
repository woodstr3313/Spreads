import { ExtractionCandidate, MappingSuggestion } from '@aws-spreads-poc/contracts';

export interface CanonicalTag {
  tag: string;
  aliases: string[];
  statementTypes: string[];
}

export const CANONICAL_TAGS: CanonicalTag[] = [
  { tag: 'CASH_AND_EQUIVALENTS', aliases: ['cash', 'cash and cash equivalents'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'ACCOUNTS_RECEIVABLE', aliases: ['accounts receivable', 'a/r'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'TOTAL_CURRENT_ASSETS', aliases: ['total current assets'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'TOTAL_ASSETS', aliases: ['total assets'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'ACCOUNTS_PAYABLE', aliases: ['accounts payable', 'a/p'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'TOTAL_CURRENT_LIABILITIES', aliases: ['total current liabilities'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'TOTAL_LIABILITIES', aliases: ['total liabilities'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'TOTAL_EQUITY', aliases: ['total equity', 'shareholders equity'], statementTypes: ['BALANCE_SHEET'] },
  { tag: 'NET_SALES', aliases: ['net sales', 'revenue', 'sales'], statementTypes: ['INCOME_STATEMENT'] },
  { tag: 'COST_OF_GOODS_SOLD', aliases: ['cost of goods sold', 'cogs'], statementTypes: ['INCOME_STATEMENT'] },
  { tag: 'GROSS_PROFIT', aliases: ['gross profit'], statementTypes: ['INCOME_STATEMENT'] },
  { tag: 'OPERATING_EXPENSES', aliases: ['operating expenses', 'opex'], statementTypes: ['INCOME_STATEMENT'] },
  { tag: 'EBITDA', aliases: ['ebitda'], statementTypes: ['INCOME_STATEMENT'] },
  { tag: 'INTEREST_EXPENSE', aliases: ['interest expense'], statementTypes: ['INCOME_STATEMENT'] },
  { tag: 'NET_INCOME', aliases: ['net income', 'net earnings'], statementTypes: ['INCOME_STATEMENT'] }
];

function normalizeLabel(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreAliasMatch(label: string, alias: string): number {
  if (label === alias) return 1;
  if (label.includes(alias) || alias.includes(label)) return 0.85;
  const labelTokens = new Set(label.split(' '));
  const aliasTokens = alias.split(' ');
  const overlap = aliasTokens.filter((token) => labelTokens.has(token)).length;
  return overlap / Math.max(aliasTokens.length, 1);
}

export function suggestMappings(
  candidate: ExtractionCandidate,
  templateRowLookup: Record<string, string>
): MappingSuggestion[] {
  const label = normalizeLabel(candidate.sourceLabel);
  const rows = Object.entries(templateRowLookup);

  return CANONICAL_TAGS
    .filter((tag) => tag.statementTypes.includes(candidate.statementType))
    .map((tag) => ({
      tag: tag.tag,
      score: Math.max(...tag.aliases.map((alias) => scoreAliasMatch(label, normalizeLabel(alias))))
    }))
    .filter((result) => result.score >= 0.5)
    .flatMap((result) => {
      return rows
        .filter(([, normalizedTag]) => normalizedTag === result.tag)
        .map(([templateRowId]) => ({
          normalizedTag: result.tag,
          templateRowId,
          confidence: result.score,
          rationale: `Matched source label \"${candidate.sourceLabel}\" to canonical tag ${result.tag}`
        }));
    })
    .sort((a, b) => b.confidence - a.confidence);
}
