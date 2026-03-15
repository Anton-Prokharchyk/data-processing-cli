import crypto from 'node:crypto';
import fs from 'node:fs';

import { checkIsValidPathToFile, pathResolver } from '../utils/pathResolver.js';

export const encrypt = async ( input, output, password ) => {
    const inputPath = await pathResolver(input);
      const outputPath = await pathResolver(output);
          const isValidPathToFile = await checkIsValidPathToFile(inputPath);
          if(!isValidPathToFile) throw new Error();
      
  return new Promise((resolve) => {


    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, key) => {
      if (err) {
        console.error('Operation failed');
        return resolve();
      }

      try {
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        const readStream = fs.createReadStream(inputPath);
        const writeStream = fs.createWriteStream(outputPath);

        writeStream.write(salt);
        writeStream.write(iv);

        readStream.pipe(cipher).pipe(writeStream);

        writeStream.on('finish', () => {
          try {
            const authTag = cipher.getAuthTag(); // 16 bytes
            fs.appendFile(outputPath, authTag, (err) => {
              if (err) throw new Error();
            });
          } catch {
            throw new Error();
          }
        });

        readStream.on('error', () => {
          throw new Error();
        });

        writeStream.on('error', () => {
          throw new Error();
        });

      } catch {
        throw new Error();
      }
    });
  });
}
