{
  description = "Replit Desktop App";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells = {
          default = pkgs.mkShell {
            nativeBuildInputs = [ pkgs.nodePackages.pnpm ];
            shellHook = ''
              pnpm install
            '';
          };
        };
      });
}
