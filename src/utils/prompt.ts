import readline from 'readline';

export const prompt = (query: string, password?: boolean) =>
  new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (password) {
      const stdin = process.openStdin();
      process.stdin.on('data', char => {
        switch (char.toString()) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.pause();
            break;
          default:
            process.stdout.clearLine(-1);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(query + Array(rl.line.length + 1).join('*'));
            break;
        }
      });
    }

    rl.question(query, (value: string) => {
      resolve(value);
      rl.close();
    });
  });
