import { exec } from 'child_process';
import nodePath from 'path';
import { existsSync } from 'fs';
const oxlintPlugin = (options = {}) => {
    let timeoutId = null;
    const debounceTime = 300;
    const executeCommand = async () => {
        const { path = '', ignorePattern = '', configFile = 'oxlintrc.json', deny = ['correctness'], allow = [], warn = [], params = '', } = options;
        const commandBase = `npx oxlint`;
        const configFilePath = nodePath.join(process.cwd(), configFile);
        const configFileExists = existsSync(configFilePath);
        const commandParams = configFileExists
            ? ` -c ${configFilePath}`
            : `${deny.map(d => ` -D ${d}`).join('')}${allow
                .map(a => ` -A ${a}`)
                .join('')}${warn.map(w => ` -W ${w}`).join('')}`;
        const command = `${commandBase}${ignorePattern ? ` --ignore-pattern=${ignorePattern} ` : ''}${commandParams} ${params}`;
        const cwd = nodePath.join(process.cwd(), path);
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (stderr) {
                    console.error(`oxlint Stderr: ${stderr}`);
                }
                if (stdout) {
                    console.log(`oxlint Output:\n${stdout}`);
                }
                if (error) {
                    console.error(`oxlint Error: ${error.message}`);
                    reject(error);
                }
                else {
                    resolve();
                }
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
