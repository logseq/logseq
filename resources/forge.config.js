const path = require('path')

module.exports = {
  packagerConfig: {
    icon: './icons/logseq_big_sur.icns'
  },

  makers: [
    {
      'name': '@electron-forge/maker-squirrel',
      'config': {
        'name': 'Logseq'
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './icons/logseq_big_sur.icns',
        name: 'Logseq'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux']
    }
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'logseq',
          name: 'logseq'
        },
        prerelease: true
      }
    }
  ]
}
