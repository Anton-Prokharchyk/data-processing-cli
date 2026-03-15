import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { count } from './commands/count.js';
import { logStats } from './commands/logStats.js';
import { csvToJson } from './commands/csvToJson.js';
import { decrypt } from './commands/decrypt.js';
import { encrypt } from './commands/encrypt.js';
import { hash } from './commands/hash.js';
import { hashCompare } from './commands/hashCompare.js';
import { jsonToCsv } from './commands/jsonToCsv.js';
import { allowCd, goUp, listDir } from './navigation.js';
import { getArgs } from './utils/argParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentDir = __dirname;

const print = (msg) => console.log(msg);
const printCurrentDir = (path) => print(`You are currently in ${path}`);


const COMMANDS = {
    up : 'up',
    cd : 'cd',
    ls : 'ls',
    hash : 'hash',
    logStats : 'log-stats',
    encrypt : 'encrypt',
    decrypt : 'decrypt',
    hashCompare : 'hash-compare',
    count : 'count',
    csvToJson : 'csv-to-json',
    jsonToCsv : 'json-to-csv',
    exit : '.exit'
}

export const repl = async ({exitmsg, wlcmsg, invalidCmdMsg, operFailedMsg}) => {

    const init = () => {
        print(wlcmsg);
        printCurrentDir(currentDir);
    }
    const gracefulShutdown = () => {
        print(`${exitmsg}`);
        rl.close();
        process.exit(0);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    
    rl.on('SIGINT', () => {
        gracefulShutdown();
    });
    
    init();
    while (true) {
        const input = await rl.question('>');
        const cmd = input.split(' ')[0];
        const args = getArgs(input.split(' ').slice(1).join(' '));
        
        switch(cmd) {
            case COMMANDS.logStats:
                {
                    const { input : inputPath, output : outputPath } = args;
                    if(!inputPath || !outputPath) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        await logStats(inputPath, outputPath);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.csvToJson:
                {
                    const { input : inputPath, output : outputPath } = args;
                    if(!inputPath || !outputPath) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        await csvToJson(inputPath, outputPath);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.jsonToCsv:
                {
                    const { input : inputPath, output : outputPath } = args;
                    if(!inputPath || !outputPath) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        await jsonToCsv(inputPath, outputPath);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.count:
                {
                    const { input : inputPath} = args;
                    if(!inputPath) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        const res = await count(inputPath);
                        print(res);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.hash:
                {
                    const { input : inputPath, algorithm = 'sha256', save = false} = args;
                    if(!inputPath) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        const res = await hash(inputPath, algorithm, save);
                        print(res);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.hashCompare:
                {
                    const { input : inputPath, algorithm = 'sha256', hash } = args;
                    if(!inputPath || !hash) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        await hashCompare(inputPath, hash, algorithm);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.decrypt:
                {
                    const { input : inputPath, output : outputPath, password } = args;
                    if(!inputPath || !outputPath || !password) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        await decrypt(inputPath, outputPath, password);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.encrypt:
                {
                    const { input : inputPath, output : outputPath, password } = args;
                    if(!inputPath || !outputPath || !password) {
                        print(operFailedMsg);
                        break;
                    }
                    try {
                        
                        await encrypt(inputPath, outputPath, password);
                    } catch(e) {
                        print(operFailedMsg);
                        break;
                    }
                    printCurrentDir(currentDir);
                    break;
                }
            case COMMANDS.up:
                currentDir = goUp(currentDir);
                printCurrentDir(currentDir);
                break;
            case COMMANDS.ls:
                const list = await listDir(currentDir);
                print(list);
                printCurrentDir(currentDir);
                break;
            case COMMANDS.cd:
                const pathToGo = await allowCd(input, currentDir);
                if(!pathToGo) {
                    print(operFailedMsg);
                    break;
                }
                currentDir = pathToGo;
                printCurrentDir(currentDir);
                break;
            case COMMANDS.exit:
                gracefulShutdown();
            default:
                print(invalidCmdMsg);
        }
        
    }
    

}