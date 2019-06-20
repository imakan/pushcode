const gitInfo = require("../gitInfo");
const fs = require("fs");
const chalk = require("chalk");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const loading = require("loading-cli");
const { relovePath } = require("../config");
const { encodeStr } = require("../util");

let log = console.log;
let error = chalk.bold.red;
let warn = chalk.keyword("orange");

/**
 * @param {string} relovePath 文件目录
 */
let createTempDir = async relovePath => {
  await exec(`rm -rf ${relovePath}`);
  const err = fs.mkdirSync(relovePath, { recursive: true });
  if (err) {
    await exec(`rm -rf ${relovePath}`);
    log(error(`${relovePath}:目录创建失败`));
    process.exit();
  }
};

/**
 * @param {string} url git仓库地址
 * @param {string} userName 用户名
 * @param {string} password 密码
 * @param {string} relovePath 当前工作目录
 * @return {any}
 */
let cloneProject = async (type, url, relovePath, userName, password) => {
  const load = loading({
    text: warn("正在clone项目..."),
    interval: 100,
    frames: ["◐", "◓", "◑", "◒"]
  }).start();
  if (type === 1) {
    let token = `${encodeStr(userName)}:${encodeStr(password)}@`;
    let _url = url.match(/^(https?:\/\/)(.*)/);
    url = _url[1] + token + _url[2];
  }
  await exec(`git clone ${url} ./`, { cwd: relovePath });
  await exec(`git config core.ignorecase false`, { cwd: relovePath });
  load.stop();
};

let getProject = async titleMsg => {
  try {
    let gitConfig = await gitInfo(titleMsg);
    await createTempDir(relovePath);
    if (gitConfig.ssh) {
      await cloneProject(2, gitConfig.remote, relovePath, null, null);
    } else {
      await cloneProject(
        1,
        gitConfig.remote,
        relovePath,
        gitConfig.userName,
        gitConfig.password
      );
    }
    return gitConfig;
  } catch (e) {
    console.log(e);
    await exec(`rm -rf ${relovePath}`);
    process.exit();
  }
};

module.exports = getProject;
