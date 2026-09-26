// Claude Code reports work through OSC 9;4 (terminal progress): state 0 clears it
// (idle, or waiting on the user), 1-4 mean a task is running. Returns true/false for
// the last such marker in `data`, or undefined when there is none.
const PROGRESS = /\x1b\]9;4;(\d)/g;

function detectBusy(data) {
  let busy;
  for (const m of data.matchAll(PROGRESS)) busy = m[1] !== '0';
  return busy;
}

module.exports = { detectBusy };
