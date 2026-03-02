export interface Options {
  path?: string
  ignorePattern?: string
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
}
