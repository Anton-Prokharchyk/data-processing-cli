import fs from 'node:fs';
import { parentPort, workerData } from 'node:worker_threads';

const { inputPath, range } = workerData;

const partial = {
  total: 0,
  levels: {},
  status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
  paths: {},
  responseTimeSum: 0
};

const stream = fs.createReadStream(inputPath, {
  encoding: 'utf8',
  start: range.start,
  end: range.end
});

let leftover = '';

stream.on('data', chunk => {
  const data = leftover + chunk;
  const lines = data.split('\n');
  leftover = lines.pop() || '';

  for (const line of lines) {
    processLine(line);
  }
});

stream.on('end', () => {
  if (leftover) processLine(leftover);
  parentPort.postMessage(partial);
});

stream.on('error', () => {
  parentPort.postMessage(partial);
});

function processLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  const parts = trimmed.split(/\s+/);
  if (parts.length < 7) return;

  const level = parts[1];
  const statusCode = Number(parts[3]);
  const responseTimeMs = Number(parts[4]);
  const path = parts[6];

  partial.total++;

  partial.levels[level] = (partial.levels[level] || 0) + 1;

  const cls = Math.floor(statusCode / 100);
  const key = `${cls}xx`;
  if (partial.status[key] !== undefined) {
    partial.status[key]++;
  }

  partial.paths[path] = (partial.paths[path] || 0) + 1;

  partial.responseTimeSum += responseTimeMs;
}
