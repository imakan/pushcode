const dev_url = ''
// 预上线环境仓库地址
const preonline_url = ''
// 线上环境仓库地址
const online_url = ''
// 脚本根据本地分支自动推送到远程仓库，这里根据您的本地分支名字自主修改
// `${dev_branch}`分支推送到`dev_url`
const dev_branch = 'dev'
// `${preonline_branch}`分支推送到`preonline_url`
const preonline_branch = 'release'
// `${online_branch}`分支推送到`online_url`
const online_branch = 'master'
module.exports = {
  dev_url,
  preonline_url,
  online_url,
  dev_branch,
  preonline_branch,
  online_branch
}