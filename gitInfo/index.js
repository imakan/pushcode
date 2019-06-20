#!/usr/bin/env node
const path = require("path");
const os = require("os");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const chalk = require("chalk");
const inquirer = require("inquirer");
const { branch } = require("../util");
let {
  dev_branch,
  preonline_branch,
  online_branch,
  dev_url,
  preonline_url,
  online_url
} = require('../config');

let log = console.log;
let error = chalk.bold.red;
let info = chalk.rgb(10, 100, 200);
let warn = chalk.keyword("orange");
let regExp = /^(https?\:\/\/|(ssh:\/\/)?git@).+(git)$/;

let getGitUser = async () => {
  const { stdout } = await exec(`git config -l | grep 'user.name'`, {
    cwd: process.cwd()
  });
  let userName = "";
  stdout && (userName = stdout.split("=")[1].trim());
  userName = stdout
    .toString()
    .replace(/user.name=/g, "")
    .split(os.EOL);
  let _username = userName.filter(cr => {
    return cr;
  });
  if (_username.length > 1) {
    log(
      info(
        `您本地配置存在多个用户名，脚本将使用' ${error(
          _username[_username.length - 1]
        )} `
      )
    );
  }
  return _username[_username.length - 1];
};

let getGitConfig = async () => {
  let sshFlag = br => {
    let obj = {
      ssh: false,
      remote: ""
    };
    let result = br.match(regExp);
    if (br) {
      if (result && result.length) {
        obj.remote = result[0];
        result[1].indexOf("http") > -1 ? (obj.ssh = false) : (obj.ssh = true);
      } else {
        log(warn("配置项中地址填写有误"));
        process.exit();
      }
    }
    return obj;
  };
  let currentBranch = await branch();
  let gitConfig = {
    currentBranch: currentBranch,
    userName: "",
    password: "",
    remote: "",
    branchDesc: "",
    ssh: false
  };
  if (fs.existsSync(path.join(os.homedir(), ".pushcode_conf"))) {
    let content = fs.readFileSync(
      path.join(os.homedir(), ".pushcode_conf"),
      "utf8"
    );
    content = JSON.parse(content);
    gitConfig.userName = content.userName;
    gitConfig.password = content.password;
  }
  if (currentBranch == dev_branch) {
    gitConfig.branchDesc = "测试环境";
    let obj = sshFlag(dev_url);
    gitConfig.remote = obj.remote;
    gitConfig.ssh = obj.ssh;
  } else if (currentBranch == preonline_branch) {
    gitConfig.branchDesc = "预上线环境";
    let obj = sshFlag(preonline_url);
    gitConfig.remote = obj.remote;
    gitConfig.ssh = obj.ssh;
  } else if (currentBranch == online_branch) {
    gitConfig.branchDesc = "正式环境";
    let obj = sshFlag(online_url);
    gitConfig.remote = obj.remote;
    gitConfig.ssh = obj.ssh;
  } else {
    log(warn(`配置项测试环境分支：${dev_branch}`));
    log(warn(`配置项预上线环境分支：${preonline_branch}`));
    log(warn(`配置项线上环境分支：${online_branch}`));
    process.exit();
  }
  return gitConfig;
};

let ASKREPO = info("输入远程仓库地址：");
let ASKUSERNAME = info("输入git登录用户名：");
let ASKPASS = info("输入git登录密码：");

let readline = questions => {
  let prompt = inquirer.createPromptModule();
  return new Promise((resolve, reject) => {
    prompt(questions).then(answers => {
      let value = answers[questions.name];
      if (!value) {
        if (questions.name === "title") {
          log(error(" 已取消"));
        } else if (questions.name === "userName") {
          log(error(" 用户名不能为空"));
        } else if (questions.name === "password") {
          log(error(" 密码不能为空"));
        }
        process.exit();
      }
      resolve(answers);
    });
  });
};

let getInfo = async titleMsg => {
  try {
    let gitConfig = await getGitConfig();
    await readline({
      type: "confirm",
      name: "title",
      message: info(`${titleMsg + gitConfig.branchDesc}`),
      prefix: "",
      default: "Y"
    });
    if (!gitConfig.remote) {
      let { remote } = await readline({
        type: "input",
        name: "remote",
        message: ASKREPO,
        prefix: "",
        validate: input => {
          let result = input.match(regExp);
          if (result && result.length) {
            if (result[0].indexOf("http") < 0) {
              gitConfig.ssh = true;
            }
          } else {
            log("");
            log(error(" 仓库地址不正确"));
            process.exit();
          }
          return true;
        }
      });
      gitConfig.remote = remote;
    }
    if (!gitConfig.ssh) {
      if (!gitConfig.userName || !gitConfig.password) {
        let { userName } = await readline({
          type: "input",
          name: "userName",
          message: ASKUSERNAME,
          prefix: "",
          default: await getGitUser()
        });
        let { password } = await readline({
          type: "password",
          name: "password",
          message: ASKPASS,
          prefix: "",
          mask: "*"
        });
        gitConfig.password = password;
        gitConfig.userName = userName;
        fs.writeFileSync(
          path.join(os.homedir(), ".pushcode_conf"),
          JSON.stringify({
            userName: gitConfig.userName,
            password: gitConfig.password
          }),
          "utf-8"
        );
      }
    }
    return gitConfig;
  } catch (e) {
    console.log(e);
    process.exit();
  }
};

module.exports = getInfo;
