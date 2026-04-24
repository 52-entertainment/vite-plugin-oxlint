export interface Options {
  path?: string
  ignorePattern?: string | string[]
  configFile?: string
  deny?: string[]
  allow?: string[]
  warn?: string[]
  params?: string
  oxlintPath?: string
  format?:
    | 'default'
    | 'checkstyle'
    | 'github'
    | 'gitlab'
    | 'json'
    | 'junit'
    | 'stylish'
    | 'unix'
  quiet?: boolean
  fix?: boolean
  failOnError?: boolean
  failOnWarning?: boolean
  lintOnStart?: boolean
  lintOnHotUpdate?: boolean
}
