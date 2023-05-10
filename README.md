# Replit Desktop

Welcome to the Replit desktop app for MacOS, Windows, and Linux.

The app is developed using [Electron](https://www.electronjs.org/) and packaged and distributed using [Electron Forge](https://www.electronforge.io/).

## Development

To get started, clone this repository and run `pnpm install` to install dependencies.

From there, you can start the app by running one of the following commands:

```bash
# Start the app against replit.com (as the user will see it)
pnpm start

# Start the app against a local dev server running repl-it-web (useful for testing local web changes that may affect the app)
pnpm start:local

# Start the app against staging.replit.com (useful for testing changes that may affect the app on staging)
pnpm start:staging
```

If you need to build a production version of the app, you can run:

```bash
pnpm make
```

You can then launch a packaged version of the app (needed to test certain features like auto-updating) by running the outputted binary locally (e.g. on an M1 Mac: `./out/Replit-darwin-arm64/Replit.app/Contents/MacOS/Replit`).

To test your changes on other platforms, we recommend using a Virtual Machine host like [UTM](https://mac.getutm.app).

## Release

To publish a new release of the app, run the release script like so:

```bash
pnpm release $version 
```

where `$version` is anything that either a semver release keyword like major, minor, or patch, or an exact version like `v1.0.0`.

This will trigger a GitHub workflow that builds the artifacts for each platform and uploads them to a new [Release](https://github.com/replit/desktop/releases).

Note that the Release will be in a draft state until you manually publish it. Make sure you add release notes to describe what changed since the last published version as they will be displayed to users when they download updates.

## Auto Updates

The MacOS and Windows apps support auto-updating on start-up using the Electron [autoUpdater module](https://www.electronjs.org/docs/latest/api/auto-updater).

As part of the auto-updating process, the app will communicate with our [Update Release Server](https://github.com/replit/desktop-releases/) which acts as a proxy for this repo's GitHub releases and exposes an API to fetch the latest artifacts for each platform.

## Code Signing

As part of the Release process, we sign the MacOS and Windows apps according to the instructions [here](https://www.electronforge.io/guides/code-signing).

This is done to verify that the app comes from us and to prevent users from seeing warnings when installing the app. See instructions on how to sign for each platform below:

### MacOS

To sign the app on MacOS, you need to set the `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID` environment variables before you run `pnpm make`. Those are accessible in 1Password. 

Alternatively, if you are a member of the company's Apple Developer Team, you can use your own Apple ID and app-specific password.

### Windows

To sign the Windows app, you need to set the `WINDOWS_CERTIFICATE_FILE` and `WINDOWS_CERTIFICATE_PASSWORD` environment variables before you run `pnpm make`.

To avoid leaking the certificate itself, we generate it from a Base64 encoded string rather than committing it to git.
You can find the encoded certificate and the certificate password in 1Password.

You can view and download the certificate itself by visiting the Comodo SSL Store [Certpanel dashboard](https://certpanel.com/comodo/) and logging in with the credentials found in 1Password.

Note that to recreate the `pfx` file (which is what's ultimately needed to sign the app) from the `cer` or `crt` file that you download from the Certpanel dashboard, you will need to generate it by via `openssl` by following the instructions [here](https://help.comodosslstore.com/support/solutions/articles/22000265839-windows-converting-code-signing-to-pfx). To do so, you will need our private key (also in 1Password) as well as the intermediate certificates that Comodo provides.

