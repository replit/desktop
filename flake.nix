{
  description = "Replit Desktop App";

  outputs = { self, nixpkgs }:
  let
    mkReplit = system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      pkgs.mkYarnPackage {
        src = ./.;
        packageJSON = ./package.json;
        yarnLock = ./yarn.lock;

        buildPhase = ''
          yarn --offline build
        '';

        distPhase = "true";

        installPhase = ''
          mkdir -p $out $out/bin
          cp -R deps/replit/dist $out/dist
          cp -R node_modules $out/
          cat <<EOF > $out/bin/replit
          #!${pkgs.electron}/bin/electron $out/dist/main.js
          EOF
          chmod +x $out/bin/replit
        '';
      };
  in
  {
    packages.aarch64-linux.default = mkReplit "aarch64-linux";
    packages.aarch64-darwin.default = mkReplit "aarch64-darwin";
    packages.x86_64-linux.default = mkReplit "x86_64-linux";
    packages.x86_64-darwin.default = mkReplit "x86_64-darwin";
  };
}
