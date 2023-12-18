# create-japa
> Setup japa inside an existing Node.js app

[![github-actions-image]][github-actions-url] [![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url]

![](./japa_art.png)

The `create-japa` is a CLI utility configuring Japa inside a new or existing Node.js project.

The process involves installing the required packages and creating the necessary files. The setup works with Typescript and JavaScript projects.

## Usage
Navigate to the root of your project and run the following command.

```sh
# npm
npm init japa

# yarn
yarn create japa

# pnpm
pnpm create japa
```

## Options

### `destination (optional)`

You can pass the destination directory as the first argument to the command. The `process.cwd()` will be used when the option is not defined.

```sh
npm init japa my-app
```

### `--package-manager`

Define the package manager to use to install dependencies. If not defined, we will attempt to detect the package manager using [@antfu/install-pkg
](https://github.com/antfu/install-pkg) package.

```sh
npm init japa -- --package-manager=pnpm
```

### `--plugins`
Define an array of plugins to install. We will display a series of prompts if this flag is not set.

```sh
npm init japa -- --plugins="@japa/api-client" --plugins="@japa/snapshot"
```

### `--project-type`
Define the project type for which you want to configure Japa. The value could be either `typescript` or `javascript`. If this flag is not set, we will display a prompt for the project type selection.

```sh
npm init japa -- --project-type=typescript
```

### `--sample-test-file`
Enable the flag to create a sample test file or disable it not to create it.

```sh
# Enable it
npm init japa -- --sample-test-file

# Disable it
npm init japa -- --no-sample-test-file
```

[github-actions-image]: https://img.shields.io/github/actions/workflow/status/japa/create-japa/checks.yml?style=for-the-badge
[github-actions-url]: https://github.com/japa/create-japa/actions/workflows/checks.yml "github-actions"

[npm-image]: https://img.shields.io/npm/v/create-japa.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/create-japa "npm"

[license-image]: https://img.shields.io/npm/l/create-japa?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"
