const assert = require('assert');
const { pickStats, UsageTotals } = require('../src/utils/session-stats');

// Trimmed from a real Claude Code 2.1.283 statusLine payload
const PAYLOAD = {
  effort: { level: 'high' },
  model: { id: 'claude-sonnet-5', display_name: 'Sonnet 5' },
  cost: { total_cost_usd: 0.0533014, total_duration_ms: 11085 },
  context_window: {
    total_input_tokens: 36693, total_output_tokens: 9, context_window_size: 1000000,
    used_percentage: 4, remaining_percentage: 96
  }
};

describe('pickStats', () => {
  it('extracts tokens, cost, context, effort and model', () => {
    assert.deepStrictEqual(pickStats(PAYLOAD), {
      inTokens: null, outTokens: null, cacheReadTokens: null,
      cost: 0.0533014, ctxRemaining: 96, effort: 'high', model: 'Sonnet 5'
    });
  });
  it('tolerates missing sections', () => {
    assert.deepStrictEqual(pickStats({ cost: { total_cost_usd: 1.5 } }).cost, 1.5);
    assert.strictEqual(pickStats({ cost: { total_cost_usd: 1.5 } }).inTokens, null);
  });
  it('returns null for empty or invalid payloads', () => {
    assert.strictEqual(pickStats({}), null);
    assert.strictEqual(pickStats(null), null);
    assert.strictEqual(pickStats('x'), null);
  });
});

describe('UsageTotals', () => {
  const rec = (id, usage) => JSON.stringify({ type: 'assistant', message: { id, usage } });

  it('sums usage across messages', () => {
    const t = new UsageTotals();
    t.add([
      rec('m1', { input_tokens: 2, cache_creation_input_tokens: 100, cache_read_input_tokens: 1000, output_tokens: 10 }),
      rec('m2', { input_tokens: 3, cache_creation_input_tokens: 0, cache_read_input_tokens: 1200, output_tokens: 5 })
    ].join('\n'));
    assert.deepStrictEqual(t.totals(), { inTokens: 105, outTokens: 15, cacheReadTokens: 2200 });
  });

  it('counts a message once even when it is written once per content block', () => {
    const t = new UsageTotals();
    t.add([
      rec('m1', { input_tokens: 1, output_tokens: 3 }),
      rec('m1', { input_tokens: 1, output_tokens: 9 })
    ].join('\n'));
    assert.deepStrictEqual(t.totals(), { inTokens: 1, outTokens: 9, cacheReadTokens: 0 });
  });

  it('ignores non-assistant and malformed lines', () => {
    const t = new UsageTotals();
    t.add(['{"type":"user"}', 'not json', '', JSON.stringify({ type: 'cost-state', totalCostUSD: 1 })].join('\n'));
    assert.deepStrictEqual(t.totals(), { inTokens: 0, outTokens: 0, cacheReadTokens: 0 });
  });
});
