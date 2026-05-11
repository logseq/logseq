const path = require('path')
const fs = require('fs')

module.exports = {
  packagerConfig: {
    name: 'Logseq-OG',
    icon: './icons/logseq_big_sur.icns',
    buildVersion: "92",
    appBundleId: "com.logseq.logseq-og",
    protocols: [
      {
        "protocol": "logseq-og",
        "name": "logseq-og",
        "schemes": "logseq-og"
      }
    ],
    osxSign: {
      identity: 'Developer ID Application: Logseq Inc. (K378MFWK59)',
      'hardened-runtime': true,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library'
    },
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env['APPLE_ID'],
      appleIdPassword: process.env['APPLE_ID_PASSWORD'],
      teamId: process.env['APPLE_TEAM_ID']
    },
  },
  makers: [
    {
      'name': '@electron-forge/maker-squirrel',
      'config': {
        'name': 'Logseq-OG',
        'setupIcon': './icons/logseq.ico',
        'loadingGif': './icons/installing.gif',
        'certificateFile': process.env.CODE_SIGN_CERTIFICATE_FILE,
        'certificatePassword': process.env.CODE_SIGN_CERTIFICATE_PASSWORD,
        "rfc3161TimeStampServer": "http://timestamp.digicert.com"
      }
    },
    {
      'name': '@electron-forge/maker-wix',
      'config': {
        name: 'Logseq-OG',
        icon: path.join(__dirname, './icons/logseq.ico'),
        language: 1033,
        manufacturer: 'Logseq',
        appUserModelId: 'com.logseq.logseq-og',
        upgradeCode: "fefe66fc-d1dd-445e-aa76-12c593d13a4d",
        ui: {
          enabled: false,
          chooseDirectory: true,
          images: {
            banner: path.join(__dirname, './windows/banner.jpg'),
            background: path.join(__dirname, './windows/background.jpg')
          },
        },
        // Standard WiX template appends the unsightly "(Machine - WSI)" to the name, so use our own template
        beforeCreate: (msiCreator) => {
          return new Promise((resolve, reject) => {
            fs.readFile(path.join(__dirname,"./windows/wix.xml"), "utf8" , (err, content) => {
                if (err) {
                    reject (err);
                }
                msiCreator.wixTemplate = content;
                resolve();
            });
          });
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './icons/logseq_big_sur.icns',
        name: 'Logseq-OG'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },

    {
      name: 'electron-forge-maker-appimage',
      platforms: ['linux'],
      config: {
        mimeType: ["x-scheme-handler/logseq-og"]
      }
    }
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'logseq',
          name: 'og'
        },
        prerelease: true
      }
    }
  ]
}
