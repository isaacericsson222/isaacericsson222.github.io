import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("terminal");
  if (!el) return;

  const ANSI = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",
    blink: "\x1b[5m",
    inverse: "\x1b[7m",
    hidden: "\x1b[8m",
    strike: "\x1b[9m",

    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  };

  const term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    theme: {
      background: "#0b0f14",
      foreground: "#e6edf3",
      cursor: "#e6edf3",
      selectionBackground: "#1f2a3a",
    },
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 16,
    lineHeight: 1.2,
  });

  term.open(el);

  term.focus();
  el.addEventListener("click", () => term.focus());

  const PROMPT = "$ ";
  let line = "";

  const prompt = () => term.write(PROMPT);

  const printHelp = () => {
    term.writeln(
      `${ANSI.bold}${ANSI.magenta}help${ANSI.reset}      Prints this help message`
    );
    term.writeln(
      `${ANSI.bold}${ANSI.magenta}ls${ANSI.reset}        Prints a fake directory structure`
    );
    term.writeln(
      `${ANSI.bold}${ANSI.magenta}about${ANSI.reset}     About this site`
    );
    term.writeln(
      `${ANSI.bold}${ANSI.magenta}clear${ANSI.reset}     Clears the screen`
    );
  };

  const runCommand = (cmd) => {
    switch (cmd) {
      case "":
        return;
      case "help":
        printHelp();
        break;
      case "clear":
        term.clear();
        break;
      case "ls":
        term.writeln(`${ANSI.green}Hi\r\nthere\r${ANSI.reset}`);
        break;
      case "about":
        term.writeln("Isaac Ericsson — CS @ Cal Poly SLO");
        break;
      default:
        term.writeln(`${ANSI.gray}command not found:${ANSI.reset} ${cmd}`);
    }
  };

  term.writeln("Hello from your terminal");
  prompt();

  term.onData((data) => {
    if (data === "\r") {
      term.writeln("");
      runCommand(line.trim());
      line = "";
      prompt();
      return;
    }

    if (data === "\u007f") {
      if (line.length > 0) {
        line = line.slice(0, -1);
        term.write("\b \b");
      }
      return;
    }

    if (data === "\u0003") {
      term.writeln("^C");
      line = "";
      prompt();
      return;
    }

    line += data;
    term.write(data);
  });
});
