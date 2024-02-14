# Vite Plugin Oxlint

This is a Vite plugin for integrating the [Oxlint](https://oxc-project.github.io) linter into your Vite project.
This plugin is an adaptation of the [vite-plugin-biome](https://github.com/skrulling/vite-plugin-biome) for oxlint.

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

### Change working directory

You can change the directory where oxlinter will run.
Default to the root of your directory.

Examples: only lint files in yout `src` directory.

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      dir: 'src',
    }),
  ],
}
```

### Allow / Deny rules

You can allow or deny oxlinter rules or categories.
To see the list of available rules and categories, run:
`npx oxlint --rules`

Default to deny: correctness.

Example: deny (turn on) `correctness` and `perf` rules and allow (turn off) the `debugger` and `eqeqeq` rule.

```javascript
import oxlintPlugin from 'vite-plugin-oxlint'

export default {
  plugins: [
    oxlintPlugin({
      deny: ['correctness', 'perf'],
      allow: ['debugger', 'eqeqeq'],
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

## License

[MIT LICENSE](LICENSE)

[GitHub](https://github.com/52-entertainment/vite-plugin-oxlint)
