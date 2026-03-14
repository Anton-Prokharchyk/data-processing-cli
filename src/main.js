import { repl } from './repl.js';


const options = {
    wlcmsg : 'Welcome to Data Processing CLI!',
    exitmsg : 'Thank you for using Data Processing CLI!',
    invalidCmdMsg : 'Invalid input',
    operFailedMsg : 'Operation failed ',
}


const bootstap = async (options) => {
    repl(options);
    
};

bootstap(options);