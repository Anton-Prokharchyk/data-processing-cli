import { stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checkIsValidPathToDir = async (path) => {
    try{
        const  dir = await stat(path);
        return dir.isDirectory ? path : false;
    } catch (e) { return false; }
};

export const pathResolver = async (path) => resolve(__dirname, path);