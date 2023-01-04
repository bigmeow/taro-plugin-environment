# `taro-plugin-environment`

> taro 设置环境变量插件，适用于项目中多环境切换时批量设置环境变量配置

## 注意 taro 3.5.10 开始，taro 已经内置了此功能，且读取的环境变量可以直接在 config/index.js 中使用

## 使用
```bash
npm i taro-plugin-environment  -D
```

`config/index.js`配置插件：

```js
module.exports = {
    // ...
    plugins: ["taro-plugin-environment"],
    // ...
};
```

## 使用场景

假设我们开发小程序时预设有下面几个环境：
- `dev`  开发人员用环境
- `test` 测试人员用环境
- `uat`  产品人员验收用环境
- `pre`  灰度环境
- `prod` 生产环境

每个环境都有若干个环境变量不同：
比如请求的api域名、上传OSS图片域名、CDN域名等

传统的做法可能是通过下面两种方式注入环境变量：
### 一、 cross-env 注入：
```json
{
    "scripts": {
        "build:dev": "cross-env API=https://dev.abc.com CDN=https://dev-cdn.abc.com taro build --type weapp",
        "build:test": "cross-env API=https://test.abc.com CDN=https://test-cdn.abc.com taro build --type weapp",
        "build:prod": "cross-env API=https://prod.abc.com CDN=https://prod-cdn.abc.com taro build --type weapp"
    }
}
```
### 二、 使用`taro`的 [defineconstants配置](https://taro-docs.jd.com/taro/docs/config-detail#defineconstants) 注入:
`package.json`:
```json
{
    "scripts": {
        "build:dev": "cross-env mode=dev taro build --type weapp",
        "build:test": "cross-env mode=test taro build --type weapp",
        "build:prod": "cross-env mode=prod taro build --type weapp"
    }
}
```

然后 `config/index.js`:
```js
const env = {
    "dev": {
        API: "'https://dev.abc.com'",
        CDN: "'https://dev-cdn.abc.com'"
    },
    "test": {
        API: "'https://test.abc.com'",
        CDN: "'https://test-cdn.abc.com'"
    },
    "prod": {
        API: "'https://prod.abc.com'",
        CDN: "'https://prod-cdn.abc.com'"
    }
}[process.env.mode]
module.exports = {
  // ...
  defineConstants: env
}
```
然后代码中使用：
`src/app.ts`:
```ts
const App = createApp({
    onShow() {
        console.log(process.env.API, process.env.CDN);
    }
});
```

## 本插件的处理方式

新增  `--mode` 模式选项，根据 `mode` 的值读取项目根目录下对应的 `.env.${mode}` 文件， `.env.${mode}` 里集中配置环境变量

### `package.json`:
```json
{
    "scripts": {
        "build:dev": "taro build --type weapp --mode dev",
        "build:test": "cross-env mode=test taro build --type weapp --mode test",
        "build:prod": "cross-env mode=prod taro build --type weapp --mode prod"
    }
}
```

### 项目根目录下新建：

`.env.dev` 文件:
```
TARO_APP_API=https://dev.abc.com
TARO_APP_CDN=https://dev-cdn.abc.com
```

`.env.prod` 文件:
```
TARO_APP_API=https://prod.abc.com
TARO_APP_CDN=https://prod-cdn.abc.com
```

如果某个环境变量在所有 `mode` 里都有，我们可以把它写到 `.env` 文件里：
```
TARO_APP_COMMON=“所有模式都有我”
```

假设运行的是 `npm run build:dev` 命令， 那么最后注入的具体环境变量值就是:

```
TARO_APP_API=https://dev.abc.com
TARO_APP_CDN=https://dev-cdn.abc.com
TARO_APP_COMMON=“所有模式都有我”
```

假设某个环境变量仅仅在自己本地使用， 你可以新建一个 `.env.dev.local` 文件：
```
TARO_APP_API=https://myself.abc.com
```
这个`.env.dev.local`的优先级是最高的，会覆盖其他env文件中的同名环境变量

`.local` 结尾的环境变量文件应该被`.gitignore`文件忽略，不该提交到`git`上

### 优先级说明

以运行 `npm run build:dev` 命令为例，这里从高到低对环境变量的优先级排序下：

`process.env`中已经存在的环境变量 > `.env.dev.local` > `.env.dev` > `.env.local` >  `.env`


如果不传 `mode` 参数， 将默认取 `process.env.NODE_ENV` 的值作为 `mode` 的默认值


### 注意

只有 `TARO_APP_` 开头的环境变量会被注入进去， 如果你需要更改前缀规则，可以看插件API进行修改

## API

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| prefixRE | RegExp | 环境变量前缀正则匹配规则，默认 /^TARO_APP_/ |
