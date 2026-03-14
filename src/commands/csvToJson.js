import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

import { pathResolver } from '../utils/pathResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checkIsCSVFile = async (path) => {
    try{
        const file = await stat(path);
        const ext = extname(path);
        return ext === '.csv' ? path : false;
    } catch (e) { return false; }
};

export const csvToJson = async (readPath, writePath) => {
    const readPathResolved = await pathResolver(readPath);
    const writePathResolved = await pathResolver(writePath);
    const isCSV = await checkIsCSVFile(readPathResolved);
    if(!isCSV) throw new Error('File is not a CSV file');
    const transform = new Transform({
        transform(data, enc, cb) {
            const dataArr = data.toString().split('\r\n');
            const keys = dataArr[0].split(',');
            const result = dataArr.slice(1).map(item => {
                item = item.split(',');
                const obj = {};
                keys.forEach((key,index) => {
                    obj[key] = item[index];
                })
                return obj;
            })
            this.push(JSON.stringify(result,null,2));
            cb();
        }
    })
    const rs = createReadStream(readPathResolved);
    const ws = createWriteStream(writePathResolved);
    try {
        await pipeline(rs, transform, ws);
    } catch(e) {

    }
};