import { Plugin } from 'vite';
import { exec } from 'child_process';

const oxlintPlugin = (): Plugin => {
  const executeCommand = async () => {
    const command = `npx oxlint`;

    return new Promise<void>((resolve) => {
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
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
