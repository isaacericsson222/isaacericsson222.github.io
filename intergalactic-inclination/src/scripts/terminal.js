import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("terminal");
  if (!el) return;

  const ANSI = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    gray: "\x1b[90m",
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

  const runCommand = (cmd) => {
    switch (cmd) {
      case "":
        return;
      case "help":
        term.writeln("Commands: help, clear, about");
        break;
      case "clear":
        term.clear();
        break;
      case "about":
        term.writeln("Isaac Ericsson — CS @ Cal Poly SLO");
        break;
      default:
        term.writeln(`command not found: ${cmd}`);
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
