class Logger {
  /**
   * MUST ONLY be USED for logging results of the command execution,
   * so that the user could pipe the output to a file or another command.
   * MUST NOT be used for internal meta logging.
   */
  stdout(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  /**
   * Should be used for logging internal meta information,
   * such as progress, errors, etc.
   */
  stderr(message: string): void {
    process.stderr.write(`${message}\n`);
  }
}

export const logger = new Logger();
