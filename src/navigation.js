import { stat, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const goUp = (currentDir) => resolve(currentDir, '..');

export const allowCd = async (input,currentDir) => {
    const path = input.split(' ')[1];
    if(!path) return false;
    const pathToGo = join(currentDir, path);
    try{
        const  dir = await stat(pathToGo);
        return dir.isDirectory ? pathToGo : false;
    } catch (e) { return false; }
};

export const listDir = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });

  const folders = [];
  const files = [];

  for (const e of entries) {
    if (e.isDirectory()) {
      folders.push({ name: e.name, type: 'folder' });
    } else if (e.isFile()) {
      files.push({ name: e.name, type: 'file' });
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

 return [...folders, ...files]
  .map(e => `${e.name} [${e.type}]`)
  .join('\n');


};