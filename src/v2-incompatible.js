const { showIncompatiblePluginDialog } = require('@sanity/incompatible-plugin')
const { name, version } = require('./package.json')

export default showIncompatiblePluginDialog({
  name: name,
  versions: {
    v3: version,
    // Optional: If there is not v2 version of your plugin, v2 can be omitted
    v2: '^2.1.6',
  },
})
