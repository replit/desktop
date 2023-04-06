module.exports = {
  packagerConfig: {
    icon: "./assets/logo",
    executableName: "replit",
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
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "Replit",
        icon: "./assets/logo.png",
        overwrite: true,
        additionalDMGOptions: {
          "background-color": "#0E1525",
        },
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
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
};
