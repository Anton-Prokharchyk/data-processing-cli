import crypto from 'node:crypto';
import fs from 'node:fs';

import { checkIsValidPathToFile, pathResolver } from '../utils/pathResolver.js';

export const hash = async (inputPath, algorithm = 'sha256', save = false ) => {
    const resolvedPath = await pathResolver(inputPath);
    const isValidPathToFile = await checkIsValidPathToFile(resolvedPath);
    if(!isValidPathToFile) reject(new Error());
    
    return new Promise((resolve,reject) => {
    const supported = ['sha256', 'md5', 'sha512'];

    if (!supported.includes(algorithm)) {
      reject(new Error())
    }


    const hash = crypto.createHash(algorithm);
        const stream = fs.createReadStream(resolvedPath);
        
        stream.on('data', chunk => hash.update(chunk));
        
        stream.on('end', () => {
            const digest = hash.digest('hex');

              resolve(`${algorithm}: ${digest}`);
            
            if (save) {
                const outFile = `${resolvedPath}.${algorithm}`;
                fs.writeFile(outFile, digest, (err) => {
                    if (err) reject(new Error())
                        resolve();
                });
            } else {
                resolve();
            }
        });
        
        stream.on('error', (e) => {
            reject(new Error())
        });
  });
}
