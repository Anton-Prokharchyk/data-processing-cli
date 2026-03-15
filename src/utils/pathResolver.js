import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const checkIsValidPathToFile = async (path) => {
    try{
        const  file = await stat(path);
        return file.isFile ? path : false;
    } catch (e) { return false; }
};

export const checkIsValidPathToDir = async (path) => {
    try{
        const  dir = await stat(path);
        return dir.isDirectory ? path : false;
    } catch (e) { return false; }
};

export const pathResolver = async (path) => resolve(__dirname, path);