import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("terminal");
  const COOKIE_NAME = "term_state_v1";
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
    gray: "\x1b[90m",
    brightYellow: "\x1b[93m",
  };

  function setCookie(name, value, days = 7) {
    const maxAge = days * 24 * 60 * 60; // seconds
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }

  function getCookie(name) {
    const key = encodeURIComponent(name) + "=";
    const found = document.cookie
      .split("; ")
      .find((row) => row.startsWith(key));
    return found ? decodeURIComponent(found.slice(key.length)) : null;
  }

  function loadState() {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return { lines: [], history: [] };
    try {
      return JSON.parse(raw);
    } catch {
      return { lines: [], history: [] };
    }
  }

  function saveState(state) {
    const compact = {
      lines: state.lines.slice(-40),
      history: state.history.slice(-20),
    };
    setCookie(COOKIE_NAME, JSON.stringify(compact), 7);
  }

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

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  term.open(el);
  fitAddon.fit();
  term.scrollToBottom();
  window.addEventListener("resize", () => {
    fitAddon.fit();
    term.scrollToBottom();
  });

  setTimeout(() => fitAddon.fit(), 0);
  const state = loadState();

  for (const l of state.lines) term.writeln(l);
  term.scrollToBottom();

  function writelnRecord(text) {
    term.writeln(text);
    state.lines.push(text);
    saveState(state);
    term.scrollToBottom();
  }

  function clearRecord() {
    term.clear();
    state.lines = [];
    saveState(state);
  }

  term.focus();
  el.addEventListener("click", () => term.focus());

  const PROMPT = "$ "; //ADD DATE AND TIME LATER!!!
  let line = "";

  const prompt = () => {
    term.write(PROMPT);
    term.scrollToBottom();
  };
  const printHelp = () => {
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}help${ANSI.reset}      Prints this help message`
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}ls${ANSI.reset}        Prints a fake directory structure`
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}about${ANSI.reset}     About this site`
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}clear${ANSI.reset}     Clears the screen`
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}e/east${ANSI.reset}     Go to fortune-teller (only from /)`
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}w/west${ANSI.reset}     Go back home (only from /fortune-teller)`
    );
  };

  const runCommand = (cmd) => {
    switch (cmd) {
      case "":
        return;
      case "hi":
      case "Hi":
        writelnRecord("Hello!");
        break;
      case "help":
        printHelp();
        break;
      case "clear":
        clearRecord();
        break;
      case "ls":
        writelnRecord(`${ANSI.green}Hi\r\nthere${ANSI.reset}`);
        break;
      case "about":
        writelnRecord("Isaac Ericsson — CS @ Cal Poly SLO");
        break;
      case "e":
      case "east":
        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/index.html"
        )
          window.location.href = "/fortune-teller/";
        return;
      case "w":
      case "west":
        if (window.location.pathname === "/fortune-teller/")
          window.location.href = "/";
        return;
      default:
        writelnRecord(`${ANSI.gray}command not found:${ANSI.reset} ${cmd}`);
    }
  };

  if (state.lines.length === 0) {
    writelnRecord("Hello from your terminal");
  }
  prompt();

  term.onData((data) => {
    // ENTER
    if (data === "\r") {
      term.writeln("");

      const clean = line.trim();

      if (clean.length > 0) {
        writelnRecord(`${ANSI.brightYellow}${clean}${ANSI.reset}`);
      } else {
        writelnRecord("");
      }

      // record command history (once per command)

      state.history.push(clean);
      saveState(state);

      runCommand(clean);

      line = "";
      prompt();
      return;
    }

    // BACKSPACE
    if (data === "\u007f") {
      if (line.length > 0) {
        line = line.slice(0, -1);
        term.write("\b \b");
      }
      return;
    }

    // CTRL+C
    if (data === "\u0003") {
      term.writeln("^C");
      line = "";
      prompt();
      return;
    }

    // normal typing
    line += data;
    term.write(data);
  });
});
