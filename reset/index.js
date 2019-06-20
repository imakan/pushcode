const inquirer = require("inquirer");
const getProject = require("../getProject");
const chalk = require("chalk");
const os = require("os");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const loading = require("loading-cli");
const { relovePath } = require("../config");

let separator = new inquirer.Separator("--------------");
let log = console.log;
let error = chalk.bold.red;
let info = chalk.rgb(10, 100, 200);
let warn = chalk.keyword("orange");
let ASKSELECT = info("选择你要回滚的方式：");
let ASKCOMMITID = info("选择你要回滚的commitId：");
let ASKTAG = info("选择你要回滚的Tag：");

let readline = questions => {
  let prompt = inquirer.createPromptModule();
  return new Promise((resolve, reject) => {
    prompt(questions).then(answers => {
      let value = answers[questions.name];
      if (!value) {
        process.exit();
      }
      resolve(answers);
    });
  });
};
let getAllCommitId = async relovePath => {
  const { stdout } = await exec(`git log -10 --pretty=tformat:%h`, {
    cwd: relovePath
  });
  let _arr = stdout
    .toString()
    .trim()
    .split(os.EOL);
  if (_arr === 0) {
    log(error("仓库中不存在任何提交记录，无法回滚"));
    process.exit();
  }
  return _arr;
};

let getAllTag = async relovePath => {
  const { stdout } = await exec(`git tag --sort=-taggerdate`, {
    cwd: relovePath
  });
  let _arr = stdout
    .toString()
    .trim()
    .split(os.EOL);
  if (_arr === 0) {
    log(error("仓库中不存在Tag，无法回滚"));
    process.exit();
  }
  return _arr.slice(0, 10);
};

let getCommitIdOfTagArr = async (allTag, relovePath) => {
  let commitIdOfTagArr = [];
  for (let i = 0; i < allTag.length; i++) {
    if (i == 0) continue;
    let { stdout } = await exec(
      `git show -s --format=%h ${allTag[i]}^{commit}`,
      { cwd: relovePath }
    );
    commitIdOfTagArr.push({
      name: allTag[i],
      value: stdout.toString().trim()
    });
    if (i != allTag.length - 1) commitIdOfTagArr.push(separator);
  }
  return commitIdOfTagArr;
};

let pushForRollBack = async relovePath => {
  const load = loading({
    text: warn("正在推送项目..."),
    interval: 100,
    frames: ["◐", "◓", "◑", "◒"]
  }).start();
  // await exec(`git add -A`, {
  //   cwd: relovePath,
  //   maxBuffer: 200 * 1024 * 1024 * 1024
  // });
  // await exec(`git commit -m '${formatTime("yyyy-MM-dd HH:mm:ss:S")}回滚项目'`, {
  //   cwd: relovePath,
  //   maxBuffer: 200 * 1024 * 1024 * 1024
  // });
  await exec(`git push -f origin master`, {
    cwd: relovePath,
    maxBuffer: 200 * 1024 * 1024 * 1024
  });
  load.stop();
  log(info(`回滚成功`));
  await exec(`rm -rf ${relovePath}`);
};

let resetForTag = async (commitId, relovePath) => {
  try {
    await exec(`git reset ${commitId}`, { cwd: relovePath });
  } catch (e) {
    log(error("因本地文件与线上文件有变化，需要先推送代码，然后再回滚"));
    process.exit();
  }
  await pushForRollBack(relovePath);
};

let resetForCommitId = async (commitId, relovePath) => {
  try {
    await exec(`git reset ${commitId}`, { cwd: relovePath });
  } catch (e) {
    log(error("因本地文件与线上文件有变化，需要先推送代码，然后再回滚"));
    process.exit();
  }
  await pushForRollBack(relovePath);
};
let resetForHEAD = async relovePath => {
  try {
    await exec("git reset --hard HEAD~1", { cwd: relovePath });
  } catch (e) {
    log(error("因本地文件与线上文件有变化，需要先推送代码，然后再回滚"));
    process.exit();
  }
  await pushForRollBack(relovePath);
};

let askMethod = async () => {
  let selects = [
    { name: "回滚到上一次提交", value: 1 },
    separator,
    { name: "根据commitID回滚", value: 2 },
    separator,
    { name: "根据TAG回滚", value: 3 }
  ];
  let { method } = await readline({
    type: "list",
    name: "method",
    message: ASKSELECT,
    choices: selects,
    default: 0,
    prefix: ""
  });
  return method;
};

let askCommitId = async relovePath => {
  let allCommitId = await getAllCommitId(relovePath);
  let separator = new inquirer.Separator("--------------");
  let selects = [];
  for (let i = 0; i < allCommitId.length; i++) {
    if (i == 0) continue;
    selects.push(allCommitId[i]);
    if (i != allCommitId.length - 1) {
      selects.push(separator);
    }
  }
  let { commitId } = await readline({
    type: "list",
    name: "commitId",
    message: ASKCOMMITID,
    choices: selects,
    pageSize: 20,
    default: 0,
    prefix: ""
  });
  return commitId;
};

let askTag = async relovePath => {
  let allTag = await getAllTag(relovePath);
  let commitIdOfTagArr = await getCommitIdOfTagArr(allTag, relovePath);
  let { commitId } = await readline({
    type: "list",
    name: "commitId",
    message: ASKTAG,
    choices: commitIdOfTagArr,
    pageSize: 20,
    default: 0,
    prefix: ""
  });
  return commitId;
};
let reset = async () => {
  let titleMsg = `即将回滚`;
  try {
    await getProject(titleMsg);
    let method = await askMethod();
    switch (method) {
      case 1:
        await resetForHEAD(relovePath);
        break;
      case 2:
        let commitId = await askCommitId(relovePath);
        await resetForCommitId(commitId, relovePath);
        break;
      case 3:
        let commitIdForTag = await askTag(relovePath);
        await resetForTag(commitIdForTag, relovePath);
        break;
    }
  } catch (e) {
    console.log(e);
    process.exit();
  } finally {
    await exec(`rm -rf ${relovePath}`);
  }
};

module.exports = reset;
