const assert = require('assert');
const { detectBusy } = require('../src/utils/busy-detector');

// Sequences captured from a real Claude Code 2.1.283 session
const START = '\x1b]0;◐ Claude Code\x07\x1b]9;4;3;\x07';
const DONE = '\x1b]0;✳ Fox story\x07\x1b]9;4;0;\x07';

describe('detectBusy', () => {
  it('is busy when work starts', () => assert.strictEqual(detectBusy(START), true));
  it('is idle when progress is cleared', () => assert.strictEqual(detectBusy(DONE), false));
  it('uses the last marker in a chunk', () => {
    assert.strictEqual(detectBusy(START + 'text' + DONE), false);
    assert.strictEqual(detectBusy(DONE + START), true);
  });
  it('returns undefined for ordinary output and title-only changes', () => {
    assert.strictEqual(detectBusy('Ember the fox lived at the edge\r\n'), undefined);
    assert.strictEqual(detectBusy('\x1b]0;◑ Fox story\x07'), undefined);
  });
});
