module.exports = {
  packagerConfig: {
    icon: "/assets/prompt",
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
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "/assets/prompt.png",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
};
