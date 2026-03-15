import { createReadStream, createWriteStream } from 'node:fs';
import { dirname, extname } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

import { checkIsValidPathToFile, pathResolver } from '../utils/pathResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checkIsValidJson = async (path) => {
    try{
        const ext = extname(path);
        if(ext !== '.json') throw new Error('File is not a JSON file');
        return true;
    } catch (e) { throw new Error('File is not a JSON file') }
};


export const jsonToCsv = async (readPath, writePath) => {
    try {
        const readPathResolved = await pathResolver(readPath);
        const writePathResolved = await pathResolver(writePath);

        const isValidPathToFile = await checkIsValidPathToFile(readPathResolved);
        if(!isValidPathToFile) throw new Error('File is not a file');
        const isValidJsonFIle = await checkIsValidJson(readPathResolved);
        if(!isValidJsonFIle) throw new Error('File is not a JSON file');
        const transform = new Transform({
            transform(data, enc, cb) {
                const parsedData = JSON.parse(data.toString()); //data
                console.log(typeof parsedData)

                const head = (Object.keys(parsedData[0]).join(',') + '\n');
                const body = parsedData.map(item => {
                    return (Object.values(item).join(',') + '\n');
                })

                const headers = Object.keys(parsedData[0]);

                const csv =
                headers.join(',') + '\n' +
                parsedData
                    .map(obj =>
                    headers.map(h => obj[h] ?? '').join(',')
                    )
                    .join('\n') +
                '\n';

                this.push(csv);
                cb();
            }
        })
        const rs = createReadStream(readPathResolved);
        const ws = createWriteStream(writePathResolved);
   
        await pipeline(rs, transform, ws);
    } catch(e) {
        console.log(e);
        throw new Error('failed')
    }
};