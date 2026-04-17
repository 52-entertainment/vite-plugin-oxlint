[![npm version](https://img.shields.io/npm/v/vite-plugin-oxlint.svg)](https://www.npmjs.com/package/vite-plugin-oxlint)
[![license](https://img.shields.io/npm/l/vite-plugin-oxlint.svg)](https://github.com/52-entertainment/vite-plugin-oxlint/blob/main/LICENSE)

# ⚓️+⚡️Vite Plugin Oxlint

A Vite plugin for integrating the [Oxlint linter](https://oxc.rs/docs/guide/usage/linter) into your [Vite](https://vite.dev) project.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Advanced Usage](#advanced-usage)
  - [Configuration file](#configuration-file)
  - [Working directory](#working-directory)
  - [Ignore patterns](#ignore-patterns)
  - [Allow / Deny / Warn rules](#allow--deny--warn-rules)
  - [Oxlint binary path](#oxlint-binary-path)
  - [Output format](#output-format)
  - [Fail on errors or warnings](#fail-on-errors-or-warnings)
  - [Additional CLI options](#additional-cli-options)
- [Integration with ESLint](#integration-with-eslint)

## Installation

```bash
npm install vite-plugin-oxlint oxlint
```

## Usage

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [oxlintPlugin()]
}
```

## Options

| Option          | Type                 | Default         | Description                                                                                     |
| --------------- | -------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `configFile`    | `string`             | `oxlintrc.json` | Path to the oxlint config file                                                                  |
| `path`          | `string`             | `.`             | Directory where oxlint runs                                                                     |
| `ignorePattern` | `string \| string[]` | —               | Glob patterns of files to ignore                                                                |
| `allow`         | `string[]`           | —               | Rules/categories to allow (turn off)                                                            |
| `deny`          | `string[]`           | —               | Rules/categories to deny (turn on)                                                              |
| `warn`          | `string[]`           | —               | Rules/categories to warn                                                                        |
| `oxlintPath`    | `string`             | —               | Path to the oxlint binary (useful in monorepos)                                                 |
| `format`        | `string`             | `default`       | Output format (`default`, `checkstyle`, `github`, `gitlab`, `json`, `junit`, `stylish`, `unix`) |
| `quiet`         | `boolean`            | `false`         | Suppress warnings, only report errors                                                           |
| `fix`           | `boolean`            | `false`         | Enable auto-fixing                                                                              |
| `failOnError`   | `boolean`            | `false`         | Fail the build on lint errors                                                                   |
| `failOnWarning` | `boolean`            | `false`         | Fail the build on lint warnings                                                                 |
| `lintOnStart`   | `boolean`            | `true`          | Run oxlint when the build starts                                                                |
| `params`        | `string`             | —               | Additional raw CLI flags passed to oxlint                                                       |

## Advanced Usage

All examples below assume the following setup:

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      /* options here */
    })
  ]
}
```

### Configuration file

Use a custom [oxlint config file](https://oxc.rs/docs/guide/usage/linter/config.html). Default is `oxlintrc.json`.
Note: `allow`, `deny`, and `warn` options override config file rules.

```javascript
{
  configFile: 'eslintrc.json'
}
```

### Working directory

Restrict linting to a subdirectory. Default is the project root.

```javascript
{
  path: 'src'
}
```

### Ignore patterns

Ignore files using `.gitignore`-style patterns. See [oxlint ignore docs](https://oxc.rs/docs/guide/usage/linter/cli.html#ignore-files).
Quote patterns to avoid shell glob interpretation.

```javascript
// Single pattern
{
  ignorePattern: '"test.js"'
}

// Multiple patterns
{
  ignorePattern: ['"test.js"', '"dist/**"']
}
```

### Allow / Deny / Warn rules

Control which rules or categories are active. Run `npx oxlint --rules` to list available rules and categories.
These options override any rules defined in the config file.

```javascript
{
  deny: ['correctness', 'perf'],   // turn on
  allow: ['debugger', 'eqeqeq'],  // turn off
  warn: ['suspicious']
}
```

### Oxlint binary path

In monorepos, if you get "command not found: oxlint" errors, specify the binary path explicitly.
Without this option, the plugin falls back to `npx` (or your package manager's equivalent).

```javascript
{
  oxlintPath: '/path/to/your/monorepo/node_modules/.bin/oxlint'
}
```

### Output format

Change how lint diagnostics are reported. See [oxlint output formats](https://oxc.rs/docs/guide/usage/linter/output-formats.html).
Available: `default`, `checkstyle`, `github`, `gitlab`, `json`, `junit`, `stylish`, `unix`.

```javascript
{
  format: 'stylish'
}
```

### Fail on errors or warnings

By default, lint issues are logged but don't fail the build.

```javascript
// Suppress warnings entirely (only report errors)
{
  quiet: true
}

// Fail on errors
{
  failOnError: true
}

// Fail on warnings
{
  failOnWarning: true
}

// Disable linting at build start (only lint on file changes during dev)
{
  lintOnStart: false
}
```

### Additional CLI options

Pass any raw CLI flags as a string. See [oxlint CLI options](https://oxc-project.github.io/docs/guide/usage/linter.html#useful-options).

```javascript
{
  params: '--deny-warnings --quiet'
}
```

## Integration with ESLint

If your project still needs ESLint, use [vite-plugin-eslint](https://github.com/gxmari007/vite-plugin-eslint) alongside this plugin, and configure ESLint with [eslint-plugin-oxlint](https://github.com/oxc-project/eslint-plugin-oxlint) to disable rules already covered by oxlint.

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'
import eslintPlugin from 'vite-plugin-eslint'

export default {
  plugins: [oxlintPlugin(), eslintPlugin()]
}
```

## License

[MIT LICENSE](LICENSE)
