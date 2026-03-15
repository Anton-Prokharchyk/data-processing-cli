import fsp from 'node:fs/promises';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { checkIsValidPathToFile, pathResolver } from '../utils/pathResolver.js';



export const logStats = async ( input, output ) => {
    const inputPath = await pathResolver(input);
    const outputPath = await pathResolver(output);
    const isValidPathToFile = await checkIsValidPathToFile(inputPath);
    if(!isValidPathToFile) throw new Error();

  try {
    await fsp.access(inputPath);
  } catch {
    throw new Error();
  }

  const { size: fileSize } = await fsp.stat(inputPath);
  const cpuCount = os.cpus().length;

  if (fileSize === 0) {
    await fsp.writeFile(outputPath, JSON.stringify({
      total: 0,
      levels: {},
      status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
      topPaths: [],
      avgResponseTimeMs: 0
    }, null, 2));
    return;
  }

  const approxChunkSize = Math.ceil(fileSize / cpuCount);

  const ranges = await computeRanges(inputPath, fileSize, approxChunkSize);


  const workerFile = new URL('../workers/logWorker.js', import.meta.url).pathname;

  
  const partials = await Promise.all(
    ranges.map(range => runWorker(workerFile, inputPath, range))
  );

  const result = mergePartials(partials);

  await fsp.writeFile(outputPath, JSON.stringify(result, null, 2));
}

async function computeRanges(filePath, fileSize, approxChunkSize) {
  const ranges = [];
  let start = 0;

  const fd = await fsp.open(filePath, 'r');

  while (start < fileSize) {
    let end = Math.min(start + approxChunkSize, fileSize - 1);

    if (end < fileSize - 1) {
      const buf = Buffer.alloc(1024);
      let pos = end;
      let found = false;

      while (pos < fileSize) {
        const toRead = Math.min(buf.length, fileSize - pos);
        const { bytesRead } = await fd.read(buf, 0, toRead, pos);
        if (bytesRead === 0) break;

        for (let i = 0; i < bytesRead; i++) {
          if (buf[i] === 0x0a) { // '\n'
            end = pos + i;
            found = true;
            break;
          }
        }
        if (found) break;
        pos += bytesRead;
      }
    }

    ranges.push({ start, end });
    start = end + 1;
  }

  await fd.close();
  return ranges;
}

function runWorker(workerFile, inputPath, range) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, {
      workerData: { inputPath, range }
    });

    worker.on('message', msg => resolve(msg));
    worker.on('error', () => {
      // console.log('Operation failed');
      resolve(emptyPartial());
    });
    worker.on('exit', code => {
      if (code !== 0) {
        // console.log('Operation failed');
        resolve(emptyPartial());
      }
    });
  });
}

function emptyPartial() {
  return {
    total: 0,
    levels: {},
    status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    paths: {},
    responseTimeSum: 0
  };
}

function mergePartials(partials) {
  const result = emptyPartial();

  for (const p of partials) {
    result.total += p.total;
    result.responseTimeSum += p.responseTimeSum;

    for (const [lvl, c] of Object.entries(p.levels)) {
      result.levels[lvl] = (result.levels[lvl] || 0) + c;
    }

    for (const [cls, c] of Object.entries(p.status)) {
      result.status[cls] = (result.status[cls] || 0) + c;
    }

    for (const [path, c] of Object.entries(p.paths)) {
      result.paths[path] = (result.paths[path] || 0) + c;
    }
  }

  const topPaths = Object.entries(result.paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  const avgResponseTimeMs =
    result.total > 0 ? Number((result.responseTimeSum / result.total).toFixed(2)) : 0;

  return {
    total: result.total,
    levels: result.levels,
    status: result.status,
    topPaths,
    avgResponseTimeMs
  };
}
