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

## License

[MIT LICENSE](LICENSE)

[GitHub](https://github.com/52-entertainment/vite-plugin-oxlint)
