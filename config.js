const path = require("path");
const fs = require("fs");
const defaultConfig = require("./.git_pushcode_config");

let projectConfig = {};
let filePath = path.resolve(process.cwd(), ".git_pushcode_config.js");
if (fs.existsSync(filePath)) {
  projectConfig = require(filePath);
}
let {
  dev_branch,
  preonline_branch,
  online_branch,
  dev_url,
  preonline_url,
  online_url
} = { ...defaultConfig, ...projectConfig };

module.exports = {
  relovePath: path.resolve(process.cwd(), "./temp_project"),
  excludeList: path.resolve(__dirname, "./exclude.list"),
  dev_branch,
  preonline_branch,
  online_branch,
  dev_url,
  preonline_url,
  online_url
};
