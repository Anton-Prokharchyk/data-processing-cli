import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { csvToJson } from './commands/csvToJson.js';
import { getArgs } from './utils/argParser.js';
import { allowCd, goUp, listDir } from './navigation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentDir = __dirname;

const print = (msg) => console.log(msg);
const printCurrentDir = (path) => print(`You are currently in ${path}`);


const COMMANDS = {
    up : 'up',
    cd : 'cd',
    ls : 'ls',
    csvToJson : 'csv-to-json',
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
        console.log(cmd);
        
        switch(cmd) {
            case COMMANDS.csvToJson:
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