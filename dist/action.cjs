"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/action.ts
var action_exports = {};
__export(action_exports, {
  action: () => action
});
module.exports = __toCommonJS(action_exports);
var core2 = __toESM(require("@actions/core"), 1);

// src/util.ts
var core = __toESM(require("@actions/core"), 1);
var import_child_process = require("child_process");
var errorOut = (data, hideWarning = false) => {
  console.log(data);
  if (typeof data === "object" && data?.message) data = data?.message;
  if (typeof data === "string") {
    if (!data?.toLowerCase()?.includes("warn") && !data?.startsWith("error Command failed") && !data?.startsWith("Exit code") && !data?.startsWith("Command:") && !data?.startsWith("Arguments:") && !data?.startsWith("Directory:") && !data?.startsWith("Output:") && !data?.startsWith("The process '/usr/local/bin/yarn' failed") && !data?.trim().length) {
      core.setOutput("error", data);
      core.setFailed(data);
    } else if (!hideWarning && data?.toLowerCase()?.includes("warn")) {
      core.warning(data);
    } else {
      core.debug(data);
    }
  }
};
var isSafeToken = (s) => /^[a-zA-Z0-9._/-]+$/.test(s);
var run = async (command, args) => {
  let output = "";
  if (!isSafeToken(command)) {
    throw new Error(`Unsafe command detected: ${command}`);
  }
  for (const a of args) {
    if (typeof a !== "string" || !isSafeToken(a)) {
      throw new Error(`Unsafe argument detected: ${a}`);
    }
  }
  try {
    const child = (0, import_child_process.spawn)(command, args, { shell: false });
    child.stdout?.on("data", (data) => {
      output += data.toString();
    });
    child.stderr?.on("data", (data) => {
      output += data.toString();
    });
    const exitCode = await new Promise((resolve, reject) => {
      child.on("error", (err) => reject(err));
      child.on("close", (code) => resolve(code ?? 0));
    });
    if (exitCode !== 0) {
      errorOut(output, command === "yarn");
    }
    return output.trim();
  } catch (error) {
    errorOut(error);
    return output.trim();
  }
};

// src/action.ts
var action = async () => {
  try {
    const { GITHUB_SHA } = process.env;
    const ref = core2.getInput("ref") || "origin/main";
    const sha = core2.getInput("sha");
    core2.debug(`ref: ${ref}`);
    core2.debug(`sha: ${sha}`);
    core2.debug(`github sha: ${GITHUB_SHA}`);
    let commit = "";
    if (sha) {
      commit = sha;
    } else if (GITHUB_SHA) {
      commit = GITHUB_SHA;
    } else {
      commit = await run("git", ["rev-parse", "HEAD"]) ?? "";
    }
    core2.debug(`commit: ${commit}`);
    const mainLog = await run("git", ["log", ref]) ?? "";
    const main = mainLog?.split("\n")[0]?.split(" ")[1] || "";
    core2.debug(`main: ${main}`);
    const base = await run("git", ["merge-base", main, commit]);
    core2.debug(`base: ${base}`);
    const tree = await run("git", ["merge-tree", base, main, commit]) ?? "";
    core2.debug(`tree: ${tree}`);
    const filters = /^ {2}our|^ {2}their/;
    const diff = tree.split("\n").filter((line) => filters.test(line)).map((line) => line.replace(/\s+/g, " ").split(" ")[4]).join(" ");
    core2.debug(`diff: ${diff}`);
    core2.setOutput("diff", diff);
    core2.setOutput("changed", diff.trim().length > 0);
  } catch (error) {
    core2.setFailed(error.message);
  }
};
void action();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  action
});
