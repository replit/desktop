{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }:
    let
      mkDevShell = system:
        let pkgs = nixpkgs.legacyPackages.${system};
        in pkgs.mkShell { buildInputs = with pkgs; [ nodejs_20 pnpm ]; };
    in {
      devShells.aarch64-darwin.default = mkDevShell "aarch64-darwin";
      devShells.x86_64-linux.default = mkDevShell "x86_64-linux";
    };
}
