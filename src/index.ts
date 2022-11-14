
import { IPluginContext } from '@tarojs/service'
import * as path from 'path'
import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'

export interface EnvPluginOpts {
  /** 环境变量前缀正则匹配规则，默认 /^TARO_APP_/ */
  prefixRE?: RegExp;
}

export default function (ctx: IPluginContext, pluginOpts: EnvPluginOpts) {
  const { fs, printLog, processTypeEnum, createDebug } = ctx.helper
  const { appPath: contextPath } = ctx.paths
  const ciArgs = require('minimist')(process.argv.slice(2), {
    string: 'mode'
  })

  const mode = ciArgs.mode || process.env.NODE_ENV

  printLog(processTypeEnum.START, 'taro-plugin-environment：读取env环境变量', mode)
  if (mode) {
    loadEnv(mode)
  }
  loadEnv()

  ctx.modifyWebpackChain(({ chain }) => {
    const env = resolveClientEnv()
    chain.plugin('definePlugin').tap((args) => {
      printLog(processTypeEnum.REMIND, 'taro-plugin-environment：注入env环境变量', env)
      Object.assign(args[0], env)
      return args
    })
  })

  /**
   * 读取指定模式的配置文件中的环境变量；如果环境变量已经存在在process.env中，则不会覆盖，故此先读取的环境变量优先级更高
   */
  function loadEnv (mode?: string) {
    const logger = createDebug('taro:env')
    const basePath = path.resolve(contextPath, `.env${mode ? `.${mode}` : ''}`)
    const localPath = `${basePath}.local`

    const load = (envPath) => {
      try {
        if (fs.pathExistsSync(envPath)) {
          const env = dotenv.config({ path: envPath, debug: Boolean(process.env.DEBUG) })
          dotenvExpand.expand(env)
          logger(envPath, env)
        }
      } catch (err) {
        printLog(processTypeEnum.ERROR, err)
      }
    }

    load(localPath)
    load(basePath)
  }

  const prefixRE = pluginOpts.prefixRE || /^TARO_APP_/

  function resolveClientEnv () {
    const env = {}
    Object.keys(process.env).forEach((key) => {
      if (prefixRE.test(key)) {
        env['process.env.' + key] = process.env[key]
      }
    })

    for (const key in env) {
      env[key] = JSON.stringify(env[key])
    }
    return env
  }
}
