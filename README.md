<p align="center">
  <p align="center">
    <img src="src/assets/icons/icon-128x128.png" height="100" alt="Blockcore" />
  </p>
  <h1 align="center">
    Blockcore Notes
  </h1>
  <p align="center">
    Notes app for decentralized infrastructures (Nostr and Web5)
  </p>
  <p align="center">
      <a href="https://github.com/block-core/blockcore-notes/actions"><img src="https://github.com/block-core/blockcore-notes/workflows/Build%20and%20Publish%20Web%20Site/badge.svg" /></a>
  </p>
</p>

Blockcore Notes is an app for your public and personal notes. It is built to support the Nostr and Web5 (coming in the future).

![](/src/assets/blockcore-notes-screenshot.png)

## Nostr

The Nostr support for Blockcore Notes relies on using your Nostr identity (public key) and uses a set of relays to publish and store your notes. You can run your own personal relay to always keep a backup of your notes.

## Web5

The Web5 support for Blockcore Notes relies on using your DID and use your DWN (Decentralized Web Nodes) to publish and store your notes. The Blockcore Wallet already supports and hosts an internal DWN within the extension, this can be used to store a local copy of all your notes.

## Connect using extension

Blockcore Notes require that you use an extension that keeps your keys secure and is responsible for performing signing of your notes, and performs encryption and decryption for private notes.

We suggest using [Blockcore Wallet](https://github.com/block-core/blockcore-wallet) ([Chrome Web Store](https://chrome.google.com/webstore/detail/blockcore-wallet/peigonhbenoefaeplkpalmafieegnapj)), but other options are available such as [nos2x](https://github.com/fiatjaf/nos2x) and [Alby](https://github.com/getAlby/lightning-browser-extension).

# Development

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Notes

Thoughts and ideas:

- Validate the content of certain limit and don't render at all if content is too long, or at least cut the content and only render X length. Then allow users to manually retrieve
  that exact event upon request.

## Security

There are many ways a web app can be exploited when it allow user contributed content. Any and all measurements to avoid exploits should be done, like sanitizing the input.

[XSS Filter Evasion Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html)
