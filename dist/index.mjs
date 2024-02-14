import { exec } from 'child_process';
const oxlintPlugin = (options = { path: '', deny: ['correctness'], allow: [], params: '' }) => {
    const executeCommand = async () => {
        const { deny = [], allow = [] } = options;
        const commandBase = `npx oxlint`;
        const command = `${commandBase}${deny.map(d => ` -D ${d}`).join('')}${allow.map(a => ` -A ${a}`).join('')} ${options.params}`;
        const cwd = `${process.cwd()}/${options.path}`;
        return new Promise((resolve) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (stdout) {
                    console.log(`oxlint Output:\n${stdout}`);
                }
                if (stderr) {
                    console.error(`oxlint Stderr: ${stderr}`);
                }
                if (error) {
                    // Log the error message but do not reject the promise if there's useful output
                    console.error(`oxlint Error: ${error.message}`);
                }
                resolve(); // Always resolve to continue the build process without failing
            });
        });
    };
    return {
        name: 'vite-plugin-oxlint',
        async buildStart() {
            await executeCommand();
        },
        async handleHotUpdate() {
            await executeCommand();
        },
    };
};
export default oxlintPlugin;
