# ⚓️+⚡️Vite Plugin Oxlint

This is a Vite plugin for integrating the [Oxlint](https://oxc-project.github.io) linter into your Vite project.

## Installation

```bash
npm install vite-plugin-oxlint oxlint
```

## Usage

Add the plugin to your `vite.config.js` file.

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [oxlintPlugin()],
}
```

## Advanced Usage

### Oxlint Configuration File

You can use a configuration file. See [Oxlint configuration file](https://oxc.rs/docs/guide/usage/linter/config.html).

[Allow / Deny / Warn](#allow--deny--warn-rules) will override config files rules.

Default to `oxlintrc.json`.

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      configFile: 'eslintrc.json',
    }),
  ],
}
```

### Change working directory

You can change the directory where oxlinter will run.
Default to the root of your project.

Examples: only lint files in your `src` directory.

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      path: 'src',
    }),
  ],
}
```

### Ignore patterns

You can specify patterns of files to ignore. The supported syntax is the same as for .eslintignore and .gitignore files You should quote your patterns in order to avoid shell interpretation of glob patterns
See [oxlint ignore](https://oxc.rs/docs/guide/usage/linter/cli.html#ignore-files)

Example: lint files in your `src`, but not test.js files:

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      path: 'src',
      ignorePattern: '"test.js"',
    }),
  ],
}
```

### Allow / Deny / Warn rules

You can allow, deny or warn oxlinter rules or categories.
To see the list of available rules and categories, run:
`npx oxlint --rules`
This will override [config files](#oxlint-configuration-file).

Example: deny (turn on) `correctness` and `perf` rules and allow (turn off) the `debugger` and `eqeqeq` rule.

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      deny: ['correctness', 'perf'],
      allow: ['debugger', 'eqeqeq'],
      warn: [],
    }),
  ],
}
```

### Additional oxlint config:

You can pass any additional oxlint config as a string.
See [oxlint options](https://oxc-project.github.io/docs/guide/usage/linter.html#useful-options) for a list of available options.

Example: add the `--deny-warnings` and `--quiet` option to the `vite-plugin-oxlint` config:

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      params: '--deny-warnings --quiet',
    }),
  ],
}
```

## Integration with ESlint

If your project still needs ESlint, you can use [vite-plugin-eslint](https://github.com/gxmari007/vite-plugin-eslint) and configure ESlint with [eslint-plugin-oxlint](https://github.com/oxc-project/eslint-plugin-oxlint) to turn off rules already supported in oxlint

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'
import eslintPlugin from 'vite-plugin-eslint'

export default {
  plugins: [oxlintPlugin(), eslintPlugin()],
}
```

## License

[MIT LICENSE](LICENSE)

[GitHub](https://github.com/52-entertainment/vite-plugin-oxlint)
