import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';

import { checkIsValidPathToFile, pathResolver } from '../utils/pathResolver.js';

export const decrypt = async ( input, output, password ) => {
    const inputPath = await pathResolver(input);
    const outputPath = await pathResolver(output);
    const isValidPathToFile = await checkIsValidPathToFile(inputPath);
    if(!isValidPathToFile) throw new Error();
    const SALT_LEN = 16;
  const IV_LEN = 12;
  const TAG_LEN = 16;

  try {

    const stat = await fsp.stat(inputPath);
    const fileSize = stat.size;

    if (fileSize < SALT_LEN + IV_LEN + TAG_LEN) {
      throw new Error('Operation failed');
    }

    const fd = await fsp.open(inputPath, 'r');


    const salt = Buffer.alloc(SALT_LEN);
    await fd.read(salt, 0, SALT_LEN, 0);


    const iv = Buffer.alloc(IV_LEN);
    await fd.read(iv, 0, IV_LEN, SALT_LEN);


    const authTag = Buffer.alloc(TAG_LEN);
    await fd.read(authTag, 0, TAG_LEN, fileSize - TAG_LEN);

    await fd.close();


    const key = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derived) => {
        if (err) reject(err);
        else resolve(derived);
      });
    });

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);


    const ciphertextStart = SALT_LEN + IV_LEN;
    const ciphertextEnd = fileSize - TAG_LEN - 1;

    const readStream = fs.createReadStream(inputPath, {
      start: ciphertextStart,
      end: ciphertextEnd
    });

    const writeStream = fs.createWriteStream(outputPath);

    await new Promise((resolve, reject) => {
      readStream
        .pipe(decipher)
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);

      decipher.on('error', reject);
      readStream.on('error', reject);
    });

  } catch (err) {
     throw new Error('Operation failed');
  }

}
