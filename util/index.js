const util = require("util");
const exec = util.promisify(require("child_process").exec);

let branch = async () => {
  let { stdout, stderr } = await exec(`git symbolic-ref --short -q HEAD`, {
    cwd: process.cwd()
  });
  return stdout.toString().trim();
};

let formatTime = fmt => {
  let data = new Date();
  if (!fmt) {
    return (
      data.getFullYear() +
      "" +
      (data.getMonth() + 1).toString().padStart(2, "0") +
      "" +
      data
        .getDate()
        .toString()
        .padStart(2, "0") +
      "" +
      data.getHours() +
      "" +
      data
        .getMinutes()
        .toString()
        .padStart(2, "0") +
      "" +
      data.getSeconds()
    );
  }
  let o = {
    "M+": data.getMonth() + 1,
    "d+": data.getDate(),
    "h+": data.getHours() % 12 == 0 ? 12 : data.getHours() % 12,
    "H+": data.getHours(),
    "m+": data.getMinutes(),
    "s+": data.getSeconds(),
    "q+": Math.floor((data.getMonth() + 3) / 3),
    S: data.getMilliseconds()
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (data.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (let k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
  return fmt;
};
let encodeStr = str => {
  let buf = Buffer.from(str);
  let encodeStr = "";
  let ch = "";
  for (let i = 0; i < buf.length; i++) {
    ch = buf[i].toString("16");
    if (ch.length === 1) {
      ch = "0" + ch;
    }
    encodeStr += "%" + ch;
  }
  encodeStr = encodeStr.toUpperCase();
  return encodeStr;
};

module.exports = {
  branch,
  encodeStr,
  formatTime
};
