import { spawn } from 'child_process';

export class RobotRunner {
  async execute(scriptPath, resultsDir) {
    return new Promise((resolve) => {
      const args = [
        '--outputdir', resultsDir,
        '--loglevel', 'DEBUG',
        scriptPath
      ];

      console.log(`[Runner] Executing: robot ${args.join(' ')}`);
      const child = spawn('robot', args);

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout,
          stderr
        });
      });

      child.on('error', (err) => {
        resolve({
          exitCode: -1,
          stdout,
          stderr: stderr + (err.message || 'Unknown error')
        });
      });
    });
  }
}
