class Logger {
  stdout(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  stderr(message: string): void {
    process.stderr.write(`${message}\n`);
  }
}

export const logger = new Logger();
