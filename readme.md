# 业务应用场景：
你的项目在A仓库，需要上线测试环境，线上环境等。但是测试环境使用的仓库是B仓库，正式环境使用的仓库是C仓库,那怎么办？（本地代码复制3份，然后写完一个功能复制，粘贴到另外两个仓库？，不妥）；那你可以试试这个脚本。

[观看视频介绍](http://nodestudy.sinastorage.com/87e0ca497ff04900b520e08e8b451ebf/dadf07fa.mp4)
<video controls  preload src="http://nodestudy.sinastorage.com/87e0ca497ff04900b520e08e8b451ebf/dadf07fa.mp4">
</video>

# 安装

```javascript
yarn add @sina/pushcode
// or
npm install @sina/pushcode
```


# 功能

查看帮助
```javascript
yarn run deploy --help
// or
yarn run deploy reset --help
```

+ 1、程序化推送代码到任意远程仓库

+ 2、程序化回滚远程仓库代码
  + 回滚到上一次提交记录

  + 回滚到任意的提交记录

  + 根据tag回滚代码

+ 3、自动保存用户名密码，支持重置用户名密码



# 配置

## 添加脚本命令 (必选)

`package.json`中新增命令

```javascript
"scripts": {
  "deploy": "pushcode"
}
```

##  添加项目仓库配置文件 (可选)

在项目根目录新增.git_pushcode_config.js文件，内容格式如下：
```javascript
//  测试环境仓库地址
const dev_url = ''
// 预上线环境仓库地址
const preonline_url = ''
// 线上环境仓库地址
const online_url = ''
// 脚本根据本地分支自动推送到不同的远程仓库，测试环境对应本地dev分支同理类推
const dev_branch = 'dev'
const preonline_branch = 'release'
const online_branch = 'master'
module.exports = {
  dev_url,
  preonline_url,
  online_url,
  dev_branch,
  preonline_branch,
  online_branch
}
```


# 运行


## 推送代码

```javascript
yarn run deploy 
// or
yarn run deploy push
// or 
yarn run deploy P
```

## 回滚代码

注意：回滚代码需要强制提交的权限。需要在
`Settings > Repository >  Protected Branches`
设置。 

```javascript
yarn run deploy reset
// or
yarn run deploy R

```

## 重置git远程仓库的用户名和密码

第一次执行`pushcode`脚本后，程序会记录**用户名**和**密码**，下次就不用再次输入了
```javascript
yarn run deploy delete
// or 
yarn run deploy D
```

**请注意**：

仓库地址是以下两种方式：
+ `http`开头：需要用户输入用户名密码。

+ `ssh`开头，必须确保你本地的公钥已经上传到了远程仓库



