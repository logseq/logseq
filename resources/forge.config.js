const path = require('path')

module.exports = {
  packagerConfig: {
    name: 'Logseq',
    icon: './icons/logseq_big_sur.icns',
    protocols: [
      {
        protocol: 'logseq',
        name: 'logseq',
        schemes: 'logseq',
      },
    ],
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Logseq',
        setupIcon: './icons/logseq.ico',
        loadingGif: './icons/installing.gif',
        certificateFile: process.env.CODE_SIGN_CERTIFICATE_FILE,
        certificatePassword: process.env.CODE_SIGN_CERTIFICATE_PASSWORD,
        rfc3161TimeStampServer: 'http://timestamp.digicert.com',
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './icons/logseq_big_sur.icns',
        name: 'Logseq',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
    {
      name: 'electron-forge-maker-appimage',
      platforms: ['linux'],
      config: {
        mimeType: ['x-scheme-handler/logseq'],
      },
    },
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'logseq',
          name: 'logseq',
        },
        prerelease: true,
      },
    },
  ],
}
