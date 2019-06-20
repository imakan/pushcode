#!/usr/bin/env node
/**
 * Pants module.
 * @module fs
 * @module path
 * @module child_process
 * @module util
 */
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const loading = require("loading-cli");
const getProject = require("../getProject");
const { relovePath, excludeList } = require("../config");
const { formatTime } = require("../util");

let { dev_branch, preonline_branch, online_branch } = require("../config");
let warn = chalk.keyword("orange");
let log = console.log;
let info = chalk.rgb(10, 100, 200);
/**
 * 功能：删除临时目录内的文件，将本地文件全部拷贝到临时目录
 * 移动文件时，不包含temp_dev文件
 * 使用rm -rf ./*，不会删除 (点开头的文件)
 * @param {string} relovePath
 */
let moveFileToTemp = async () => {
  await exec(`rm -rf ./*`, { cwd: relovePath });
  const load = loading({
    text: warn("正在移动项目..."),
    interval: 100,
    frames: ["◐", "◓", "◑", "◒"]
  }).start();
  await exec(
    `rsync -a --exclude-from="${excludeList}" ${process.cwd() +
      "/"} ${relovePath}`,
    { maxBuffer: 200 * 1024 * 1024 * 1024 }
  );
  load.stop();
};
/**
 * 功能：修改临时目录的ignore文件，将node_module加入其中，因为在测试环境需要加入node_module
 * 如果本地不存在.gitignore则不做任何修改
 * @param {string} relovePath 文件目录
 */
let editIgnore = async (relovePath, currentBranch) => {
  let _file = path.resolve(relovePath, "./.gitignore");
  let _isExit = fs.existsSync(_file);
  if (_isExit) {
    const readStream = fs.createReadStream(_file);
    readStream.on("data", function(chunk) {
      let content = chunk.toString();
      if (currentBranch == dev_branch) {
        // 测试环境修改.gitignore文件,推送node_modules
        content = content.replace(/node_modules/g, "makan@staff.sina.com.cn");
      } else if (currentBranch == preonline_branch) {
        // 预上线环境修改.gitignore文件,推送node_modules，同时将dockerFile文件忽略掉
        // content = content.replace(/node_modules/g, "makan@staff.sina.com.cn");
      } else if (currentBranch == online_branch) {
        // 线上环境修改.gitignore文件,推送node_modules，同时将set-up文件忽略掉
        content = content.replace(/node_modules/g, "set-up");
      } else {
        // todo预留分支逻辑
      }
      fs.createWriteStream(_file).write(content);
    });
  }
};
/**
 * 功能：将项目推送到git仓库，测试环境推送dev环境
 * 注意：因为目前的方案是，测试环境一个仓库，正式环境一个仓库，所以统一推送到仓库的master，但是在本地推送是，要区分：dev分支和master分支
 * @param {string} remote git仓库地址
 * @param {string} relovePath 当前工作目录
 */
let pushCode = async (remote, relovePath, branchDesc) => {
  const load = loading({
    text: warn("正在推送项目..."),
    interval: 100,
    frames: ["◐", "◓", "◑", "◒"]
  }).start();
  await exec(`git add -A`, {
    cwd: relovePath,
    maxBuffer: 200 * 1024 * 1024 * 1024
  });
  await exec(
    `git commit -m '${formatTime("yyyy-MM-dd HH:mm:ss:S")} 自动化推送'`,
    {
      cwd: relovePath,
      maxBuffer: 200 * 1024 * 1024 * 1024
    }
  );
  await exec(
    `git tag -a ${"tag__" +
      formatTime()} -m '${branchDesc}上线，上线时间${formatTime(
      "yyyy-MM-dd HH:mm:ss:S"
    )}'`,
    { cwd: relovePath }
  );
  await exec(`git push origin master`, {
    cwd: relovePath,
    maxBuffer: 200 * 1024 * 1024 * 1024
  });
  await exec(`git push origin --tags`, {
    cwd: relovePath,
    maxBuffer: 200 * 1024 * 1024 * 1024
  });
  load.stop();
  log(info(`成功推送到：${remote}`));
};
let push = async () => {
  /**
   * 把项目拷贝到临时目录
   * 根据环境修改gitignore
   * 推送代码
   */
  let titleMsg = `即将上线`;
  try {
    let gitConfig = await getProject(titleMsg);
    await moveFileToTemp(relovePath);
    await editIgnore(relovePath, gitConfig.currentBranch);
    await pushCode(gitConfig.remote, relovePath, gitConfig.branchDesc);
  } catch (e) {
    console.log(e);
    process.exit();
  } finally {
    await exec(`rm -rf ${relovePath}`);
  }
};

module.exports = push;
