const osxNotarize =
  process.env.APPLE_ID &&
  process.env.APPLE_PASSWORD &&
  process.env.APPLE_TEAM_ID
    ? {
        tool: "notarytool",
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID,
      }
    : undefined;

const osxSign = osxNotarize ? {} : undefined;

if (!osxNotarize) {
  console.log(
    "Notarytool credentials not passed, skipping sign and notarize step for OSX."
  );
}

module.exports = {
  packagerConfig: {
    icon: "./assets/logo",
    osxSign,
    osxNotarize,
    protocols: [
      {
        name: "Replit",
        schemes: ["replit"],
      },
    ],
  },
  rebuildConfig: {},
  hooks: {
    generateAssets: async () => {
      const cpy = (await import("cpy")).default;
      await cpy("assets", "dist");
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupIcon: "./assets/logo.ico",
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "Replit",
        icon: "./assets/logo.icns",
        overwrite: true,
        additionalDMGOptions: {
          "background-color": "#0E1525",
        },
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        mimeType: ["x-scheme-handler/replit"],
        options: {
          name: "replit",
          productName: "Replit",
          maintainer: "Replit",
          homepage: "https://replit.com",
          description: "Replit desktop app",
          icon: "./assets/logo.png",
          categories: ["Development"],
          section: "devel",
        },
      },
    },
    {
      name: "@electron-forge/maker-zip",
      config: {},
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      authToken: process.env.GH_TOKEN,
      config: {
        repository: {
          owner: "replit",
          name: "desktop",
        },
      },
    },
  ],
};
