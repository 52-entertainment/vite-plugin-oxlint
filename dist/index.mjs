import { spawn } from 'child_process';
import nodePath from 'path';
import { existsSync } from 'fs';
const oxlintPlugin = (options = {}) => {
    let timeoutId = null;
    const debounceTime = 300;
    const executeCommand = async () => {
        const { path = '', ignorePattern = '', configFile = 'oxlintrc.json', deny = [], allow = [], warn = [], params = '', } = options;
        const args = [];
        if (ignorePattern) {
            args.push(`--ignore-pattern=${ignorePattern}`);
        }
        deny.forEach(d => args.push('-D', d));
        allow.forEach(a => args.push('-A', a));
        warn.forEach(w => args.push('-W', w));
        const configFilePath = nodePath.join(process.cwd(), configFile);
        if (existsSync(configFilePath)) {
            args.push('-c', configFilePath);
        }
        if (params) {
            args.push(...params.split(' ').filter(Boolean));
        }
        const cwd = nodePath.join(process.cwd(), path);
        return new Promise((resolve, reject) => {
            const child = spawn('oxlint', args, {
                cwd,
                stdio: 'inherit',
            });
            child.on('error', error => {
                console.error(`oxlint Error: ${error.message}`);
                reject(error);
            });
            child.on('exit', code => {
                if (code === 0) {
                    console.log('Oxlint successfully finished.');
                }
                else {
                    console.warn(`Oxlint finished with exit code: ${code}`);
                }
                resolve();
            });
        });
    };
    const handleCommandExecution = async () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(async () => {
            try {
                await executeCommand();
            }
            catch (error) {
                console.error('Error executing command:', error);
            }
        }, debounceTime);
    };
    return {
        name: 'vite-plugin-oxlint',
        async buildStart() {
            await handleCommandExecution();
        },
        async handleHotUpdate() {
            await handleCommandExecution();
        },
    };
};
export default oxlintPlugin;
