import { IPluginContext } from '@tarojs/service';
export interface EnvPluginOpts {
    /** 环境变量前缀正则匹配规则，默认 /^TARO_APP_/ */
    prefixRE?: RegExp;
}
export default function (ctx: IPluginContext, pluginOpts: EnvPluginOpts): void;
