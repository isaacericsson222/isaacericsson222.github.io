import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("terminal");
  const COOKIE_NAME = "term_statev1";
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

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
    brightMagenta: "\x1b[95m",
  };
  // Wrap a string to `cols`, breaking on spaces. Preserves existing newlines.
  function wrapTextByWords(text, cols) {
    const out = [];
    const paragraphs = String(text).split(/\r?\n/);

    for (const p of paragraphs) {
      // keep blank lines
      if (p.trim() === "") {
        out.push("");
        continue;
      }

      const words = p.split(/\s+/);
      let line = "";

      for (const w of words) {
        const next = line ? `${line} ${w}` : w;

        if (stripAnsi(next).length <= cols) {
          line = next;
          continue;
        }

        if (line) out.push(line);

        // If a single word is longer than the terminal width, hard-break it.
        if (stripAnsi(w).length > cols) {
          let rest = w;
          while (stripAnsi(rest).length > cols) {
            out.push(rest.slice(0, cols));
            rest = rest.slice(cols);
          }
          line = rest;
        } else {
          line = w;
        }
      }

      if (line) out.push(line);
    }

    return out;
  }

  // Use this instead of term.writeln(text) for long prose.
  function writelnRecordWrapped(text) {
    const cols = Math.max(10, term.cols || 80);
    for (const line of wrapTextByWords(text, cols)) {
      term.writeln(line);
      state.lines.push(line);
    }
    saveState(state);
    term.scrollToBottom();
  }

  const isMobileLike = () =>
    window.matchMedia("(max-width: 767px)").matches || term.cols < 70;

  const introDesktop = () =>
    String.raw` 
----------------------------------------------------------------------${ANSI.brightYellow}
              ___                __                     
               |  _  _  _  _    |_  __ o  _  _  _  _ __ 
              _|__> (_|(_|(_    |__ |  | (_ _> _> (_)| |${ANSI.reset}

                 Welcome and try help to get started!
----------------------------------------------------------------------
      `;

  const introMobile = () =>
    String.raw`${ANSI.brightYellow}Welcome!${ANSI.reset}
    Type ${ANSI.bold}${ANSI.magenta}help${ANSI.reset} to get started.
    `;

  function setCookie(name, value, days = 7) {
    const maxAge = days * 24 * 60 * 60; // seconds
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value,
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

  const doFit = () => {
    fitAddon.fit();
    term.scrollToBottom();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(doFit);
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(doFit);
  });

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
      `${ANSI.bold}${ANSI.magenta}ls${ANSI.reset}        Shows a directory structure`,
    );
    writelnRecord(`${ANSI.bold}${ANSI.magenta}about${ANSI.reset}     About me`);
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}clear${ANSI.reset}     Clears the screen`,
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}e/east${ANSI.reset}     Go to fortune-teller`,
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}n/north${ANSI.reset}    Go to summit`,
    );
    writelnRecord(
      `${ANSI.bold}${ANSI.magenta}w/west${ANSI.reset}     Go back home`,
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
      case "look":
        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/index.html"
        )
          writelnRecordWrapped(
            `To the east lies a purple tent, to the south a creek mumbles, to the west a barren field, and to the north lies the summit`,
          );
        else writelnRecord(`Where?`);
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
        ) {
          window.location.href = "/fortune-teller/";
          writelnRecord(`You head east and enter the tent`);
        }
        return;
      case "w":
      case "west":
        if (window.location.pathname === "/fortune-teller/") {
          window.location.href = "/";
          writelnRecord(`You enter the crossroads`);
        }
        return;
      case "n":
      case "north":
        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/index.html"
        ) {
          window.location.href = "/summit/";
          writelnRecord(`You north towards the summit...`);
        }
        return;
      case "s":
      case "south":
        if (window.location.pathname === "/summit/") {
          window.location.href = "/";
          writelnRecord(`You enter the crossroads`);
        }
        return;
      default:
        writelnRecord(`${ANSI.gray}command not found:${ANSI.reset} ${cmd}`);
    }
  };

  if (state.lines.length === 0) {
    const text = isMobileLike() ? introMobile() : introDesktop();
    writelnRecord(text);
    writelnRecord("");
    writelnRecord("You are in a field, maybe look around?");
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
