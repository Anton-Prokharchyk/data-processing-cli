export const getArgs = (line) => {
    const args = line.split('--').splice(1);
    const argsObj = {}
    for(const item of args) {
        item.split('');
        const [key, value] = item.split(' ');
        argsObj[key] = value;
    }
    return argsObj;
};