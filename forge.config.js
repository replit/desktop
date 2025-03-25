const fs = require('fs/promises');
const path = require('path');

const osxNotarize =
  process.env.APPLE_ID &&
  process.env.APPLE_PASSWORD &&
  process.env.APPLE_TEAM_ID
    ? {
        tool: 'notarytool',
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID,
      }
    : undefined;

const osxSign = osxNotarize ? {} : undefined;

if (!osxNotarize) {
  // eslint-disable-next-line no-console
  console.log(
    'Notarytool credentials not passed, skipping sign and notarize step for OSX.',
  );
}

module.exports = {
  packagerConfig: {
    icon: './assets/logo',
    executableName: 'Replit',
    osxSign,
    osxNotarize,
    asar: true,

    // ignore development files like README, typescript sources, etc.
    ignore: (path) => {
      if (path === '') {
        return false;
      }

      // dist folder is necessary for the app to run
      if (path.startsWith('/dist')) {
        return false;
      }

      // package.json is necessary for the app to run
      if (path === '/package.json') {
        return false;
      }

      // node_modules are necessary, but we have to strip binaries
      if (path.includes('node_modules')) {
        const ignoreNodeBinaries = '/node_modules/\\.bin($|/)';

        return path.match(ignoreNodeBinaries);
      }

      // otherwise, ignore the file
      return true;
    },

    protocols: [
      {
        name: 'Replit',
        schemes: ['replit'],
      },
    ],
  },
  rebuildConfig: {},
  hooks: {
    generateAssets: async () => {
      const cpy = (await import('cpy')).default;
      await cpy('assets', 'dist');
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: './assets/logo.ico',
        iconUrl: 'https://replit.com/public/images/logo.ico',
        certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
        certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Replit',
        icon: './assets/logo.icns',
        overwrite: false,
        additionalDMGOptions: {
          'background-color': '#0E1525',
        },
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'replit',
          bin: 'Replit',
          productName: 'Replit',
          maintainer: 'Replit',
          mimeType: ['x-scheme-handler/replit'],
          homepage: 'https://replit.com',
          description: 'Replit desktop app',
          icon: './assets/logo.png',
          categories: ['Development'],
          section: 'devel',
        },
      },
    },
    {
      name: '@electron-forge/maker-zip',
      config: {},
    },
  ],
  hooks: {
    postMake: async (_, results) => {
      for (let result of results) {
        for (let artifact of result.artifacts) {
          if (artifact.endsWith('Replit.dmg')) {
            const dmgPath = artifact;
            if (process.arch !== 'arm64') {
              await fs.rename(
                dmgPath,
                path.join(path.dirname(dmgPath), 'Replit-Intel.dmg'),
              );
            }
          }
        }
      }
    },
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      authToken: process.env.GH_TOKEN,
      config: {
        repository: {
          owner: 'replit',
          name: 'desktop',
        },
      },
    },
  ],
};
