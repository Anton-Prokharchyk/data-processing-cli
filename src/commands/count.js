import fs from 'node:fs';

import { checkIsValidPathToFile, pathResolver } from '../utils/pathResolver.js';

export const count = async (inputPath) => {
    const resolvedPath = await pathResolver(inputPath);
    const isValidPathToFile = await checkIsValidPathToFile(resolvedPath);
    if(!isValidPathToFile) throw new Error('File is not a file');
  return new Promise((resolve, reject) => {
    let lines = 0;
    let words = 0;
    let chars = 0;

    const stream = fs.createReadStream(resolvedPath, { encoding: 'utf8' });

    stream.on('data', chunk => {
      chars += chunk.length;

      lines += chunk.split('\n').length - 1;

      words += chunk.trim().split(/\s+/).filter(Boolean).length;
    });

    stream.on('end', () => {
      resolve({ lines, words, chars });
    });

    stream.on('error', () => {
      reject(new Error('Operation failed'));
    });
  });
}
