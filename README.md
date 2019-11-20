<div align="center">
  <h1>ocaml-language-server</h1>
  <p style="margin-bottom: 0.5ex;">
    <a href="https://github.com/ocaml-lsp/ocaml-language-server/actions"><img
        src="https://github.com/ocaml-lsp/ocaml-language-server/workflows/ci/badge.svg" /></a>
    <img
        src="https://img.shields.io/badge/eslint-checked-informational?logo=eslint" />
    <img
        src="https://img.shields.io/badge/prettier-formatted-informational?logo=prettier" />
  </p>
  <p style="margin-bottom: 0.5ex;">
    <a href="https://npmjs.org/package/ocaml-language-server"><img
        src="https://img.shields.io/npm/v/ocaml-language-server.svg?logo=javascript" /></a>
    <a href="https://npmjs.org/package/ocaml-language-server"><img
        src="https://img.shields.io/npm/dm/ocaml-language-server.svg?logo=npm" /></a>
    <a href="https://npmjs.org/package/ocaml-language-server"><img
        src="https://img.shields.io/librariesio/release/npm/ocaml-language-server.svg?logo=npm" /></a>
  </p>
  <strong>A language server for <a href="http://ocaml.org">OCaml</a> and <a href="https://reasonml.github.io">Reason</a>.</strong>
</div>

## Overview

The OCaml Language Server is an implementation of the [Language Server
Protocol](https://github.com/Microsoft/language-server-protocol) (LSP) for
OCaml, Reason, and related tooling, including support for BuckleScript.

The OCaml Language Server works by providing a standardized JSON-RPC interface
(via the LSP) to existing OCaml and Reason tooling. This makes it much easier to
provide a uniform development experience across the different editors without
duplication of effort.

The OCaml Language Server is not intended to be a replacement for existing OCaml
and Reason language tooling. It is intended to make existing language
tooling–much of which is excellent and has been developed with great
effort–easier to integrate into editors and more accessible to users without
requiring extensive configuration effort.

## Features

The OCaml Language Server supports the following LSP capabilities and custom
features:

- ☑ OCaml support
- ☑ Reason support
- ☑ BuckleScript [build system](https://bucklescript.github.io/bucklescript/Manual.html#_bucklescript_build_system_code_bsb_code)
- ☑ compiler diagnostics
- ☑ incremental document synchronization
- ☑ code action provider
- ☑ code lens provider
- ☑ completion provider
- ☑ definition provider
- ☑ document formatting provider
- ☑ document highlight provider
- ☑ document range formatting provider (Reason)
- ☑ document symbol provider
- ☑ hover provider
- ☑ references provider
- ☑ workspace symbol provider

## Clients

The following editor plugins are configured to work with the OCaml Language Server:

### Installation

- [Atom](https://github.com/reasonml-editor/atom-ide-reason)

- [Code](https://github.com/freebroccolo/vscode-reasonml)

- [Oni](https://github.com/bryphe/oni/wiki/Language-Support#reason-and-ocaml)

- [Sublime Text](https://github.com/reasonml-editor/sublime-reason) (requires server installation)

- [(Neo)Vim](https://github.com/reasonml-editor/vim-reason-plus) (requires server installation)

## Server

### Installation

Some clients (noted above) do not ship the server and require it to be installed
separately:

```
npm install -g ocaml-language-server
```

### Launching

Manually launching the server should only be necessary if you are using a custom
configuration or an LSP client that is not already configured for the OCaml
Language Server. In that case, the server can be started with one of the
following commands:

```sh
ocaml-language-server --node-ipc          # communicate over the node IPC
ocaml-language-server --socket={number}   # communicate over a unix socket
ocaml-language-server --stdio             # communicate over stdio
```

## Contributing

Contributions are welcome and encouraged. Please see the following documents:

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing](CONTRIBUTING.md)
