import crypto from 'node:crypto';
import fs from 'node:fs';

import { checkIsValidPathToFile, pathResolver } from '../utils/pathResolver.js';

export const hashCompare = async (input, hashPath, algorithm = 'sha256' ) => {
  const inputPath = await pathResolver(input);
  const expectedHashPath = await pathResolver(hashPath);
      const isValidPathToFile = await checkIsValidPathToFile(inputPath);
      if(!isValidPathToFile) throw new Error();
  
      const isValidPathTohash = await checkIsValidPathToFile(expectedHashPath);
      if(!isValidPathTohash) throw new Error();
  
    return new Promise((resolve) => {
    const supported = ['sha256', 'md5', 'sha512'];

    if (!supported.includes(algorithm)) {
      console.error('Operation failed');
      return resolve();
    }


    let expectedHash;
    try {
      expectedHash = fs.readFileSync(expectedHashPath, 'utf8')
        .trim()
        .toLowerCase();
    } catch {
      console.error('Operation failed');
      throw new Error();
    }

    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(inputPath);

    stream.on('data', chunk => hash.update(chunk));

    stream.on('end', () => {
      const actualHash = hash.digest('hex').toLowerCase();

      if (actualHash === expectedHash) {
        console.log('OK');
      } else {
        console.log('MISMATCH');
      }

      resolve();
    });

    stream.on('error', () => {
      throw new Error()
    });
  });
}
