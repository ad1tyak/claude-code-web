// Reduce Claude Code's statusLine JSON payload to the few fields the tabs show.
// Returns null when the payload has nothing usable.
function pickStats(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const cw = payload.context_window || {};
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

  const stats = {
    // Token totals are filled from the transcript (see UsageTotals); the payload's own
    // token counts only describe the current request, not the session.
    inTokens: null,
    outTokens: null,
    cacheReadTokens: null,
    cost: num(payload.cost && payload.cost.total_cost_usd),
    ctxRemaining: num(cw.remaining_percentage),
    effort: (payload.effort && typeof payload.effort.level === 'string') ? payload.effort.level : null,
    model: (payload.model && typeof payload.model.display_name === 'string') ? payload.model.display_name : null
  };
  return Object.values(stats).some(v => v !== null) ? stats : null;
}

// Session token totals from a Claude transcript (JSONL). The statusLine payload only reports the
// *current* request's tokens, so the running totals are summed from each assistant message's usage.
// A message is written once per content block with the same id, so the last record per id wins.
class UsageTotals {
  constructor() {
    this.byId = new Map();
  }

  // `text` must contain whole lines
  add(text) {
    for (const line of text.split('\n')) {
      let entry;
      try { entry = JSON.parse(line); } catch (e) { continue; }
      const usage = entry && entry.type === 'assistant' && entry.message && entry.message.usage;
      if (usage) this.byId.set(entry.message.id || entry.uuid, usage);
    }
  }

  // inTokens = fresh input + cache writes (what was actually sent); cache reads are reported separately
  totals() {
    let inTokens = 0, outTokens = 0, cacheReadTokens = 0;
    for (const u of this.byId.values()) {
      inTokens += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      outTokens += u.output_tokens || 0;
      cacheReadTokens += u.cache_read_input_tokens || 0;
    }
    return { inTokens, outTokens, cacheReadTokens };
  }
}

module.exports = { pickStats, UsageTotals };
