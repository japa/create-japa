/*
 * @japa/create-japa
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { existsSync } from 'node:fs'
import gradient from 'gradient-string'
import { fileURLToPath } from 'node:url'
import detectPackageManager from 'which-pm-runs'
import { installPackage } from '@antfu/install-pkg'
import { BaseCommand, args, flags } from '@adonisjs/ace'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'

import type { PluginChoice } from './types.js'
import { ADDITIONAL_PLUGINS, ASSERTION_CHOICES, PROJECT_TYPES } from './constants.js'

const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../templates')

export class InstallJapa extends BaseCommand {
  static #isPackageInstallFaked = false
  static commandName = 'create-japa'
  static description = 'Configure Japa inside a fresh or an existing Node.js project'

  /**
   * Fake package install for testing
   */
  static fakePackageInstall() {
    this.#isPackageInstallFaked = true
  }

  /**
   * Restore package install
   */
  static restorePackageInstall() {
    this.#isPackageInstallFaked = false
  }

  /**
   * Destination directory
   */
  @args.string({ description: 'Destination', required: false })
  declare destination: string

  /**
   * Package manager to use
   */
  @flags.string({
    name: 'package-manager',
    description: 'Define the package manager to use for installing dependencies',
  })
  declare packageManager: string

  /**
   * An array of plugins to configure
   */
  @flags.array({
    description: 'Define a collection of plugins to install and configure',
  })
  declare plugins: string[]

  /**
   * Project type
   */
  @flags.string({
    description: 'Define the project type for which you want to configure Japa',
  })
  declare projectType: 'typescript' | 'javascript'

  /**
   * Whether or not to create the sample test file
   */
  @flags.boolean({
    description: 'Enable to create a sample test file',
  })
  declare sampleTestFile: boolean

  /**
   * Edge is used for evaluating templates
   */
  #edge = new Edge({ cache: false }).mount(TEMPLATES_DIR)

  /**
   * Config file bindings
   */
  #configFile = {
    imports: [] as string[],
    plugins: [] as string[],
  }

  /**
   * Whether or not to install the browser plugin.
   *
   * If true, then we have some additional steps to do,
   * like using `suites` instead of `files` in the config file.
   *
   * Also create a sample test file for the `browser` suite
   */
  #hasBrowserPlugin = false

  /**
   * Packages that should be installed
   */
  #packageToInstall: string[] = ['@japa/runner']

  /**
   * Print Title in Ascii art
   */
  #printTitle() {
    const title = Buffer.from(
      'ICAgX19fICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfICAgICAgICAgICAgCiAgfF8gIHwgICAgICAgICAgICAgICAgICAgICAgICAgICB8IHwgICAgICAgICAgIAogICAgfCB8IF9fIF8gXyBfXyAgIF9fIF8gICAgICAgIF9ffCB8IF9fX19fICAgX18KICAgIHwgfC8gX2AgfCAnXyBcIC8gX2AgfCAgICAgIC8gX2AgfC8gXyBcIFwgLyAvCi9cX18vIC8gKF98IHwgfF8pIHwgKF98IHwgIF8gIHwgKF98IHwgIF9fL1wgViAvIApcX19fXy8gXF9fLF98IC5fXy8gXF9fLF98IChfKSAgXF9fLF98XF9fX3wgXF8vICAKICAgICAgICAgICAgfCB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIHxffCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA==',
      'base64'
    ).toString()

    this.logger.log('')
    this.logger.log(gradient.fruit.multiline(title))
    this.logger.log('')
  }

  /**
   * Prompt to select an assertion library. Assertion library
   * is optional
   */
  async #promptAssertionLibrary() {
    const assertionPlugin = await this.prompt.choice(
      'Select the assertion library',
      ASSERTION_CHOICES,
      {
        validate: (value) => !!value,
      }
    )
    this.plugins.push(assertionPlugin)
  }

  /**
   * Prompt to select additional plugins
   */
  async #promptAdditionalPlugins() {
    const plugins = await this.prompt.multiple('Select additional plugins', ADDITIONAL_PLUGINS, {
      default: [],
    })
    this.plugins = this.plugins.concat(plugins)
  }

  /**
   * Setup bindings for assertion library
   */
  #prepareAssertionLibraryConfig(lib: PluginChoice) {
    const importStatement = `import { ${lib.namedImport} } from '${lib.importPath}'`

    this.#configFile.imports.push(importStatement)
    this.#configFile.plugins.push(`${lib.namedImport}()`)
  }

  /**
   * Setup bindings for additional plugins selected
   */
  #preparePluginsConfig(plugins: PluginChoice[]) {
    for (const plugin of plugins) {
      const importStatement = `import { ${plugin.namedImport} } from '${plugin.importPath}'`

      this.#configFile.imports.push(importStatement)
      this.#configFile.plugins.push(`${plugin.namedImport}(${plugin.parameters ?? ''})`)
    }
  }

  /**
   * Processing selected plugins
   */
  #processSelectedPlugins() {
    /**
     * Configuring assertion library
     */
    const assertionPlugin = ASSERTION_CHOICES.find((choice) => this.plugins.includes(choice.name))
    if (assertionPlugin) {
      this.#prepareAssertionLibraryConfig(assertionPlugin)
      this.#packageToInstall.push(...(assertionPlugin.packagesToInstall || []))
    }

    /**
     * Configuring rest of the plugins
     */
    const additionalPlugins = ADDITIONAL_PLUGINS.filter((choice) =>
      this.plugins.includes(choice.name)
    )
    this.#preparePluginsConfig(additionalPlugins)
    this.#hasBrowserPlugin = this.plugins.includes('@japa/browser-client')
    this.#packageToInstall.push(
      ...additionalPlugins.map((plugin) => plugin.packagesToInstall || []).flat()
    )
  }

  /**
   * Create sample test files.
   * May also create a browser test file if browser plugin is selected
   */
  async #createSampleTestFiles() {
    const assertionPlugin = ASSERTION_CHOICES.find((choice) => this.plugins.includes(choice.name))
    const content = await this.#edge.render('test-sample', {
      assertPlugin: assertionPlugin?.namedImport,
    })

    const destination = this.#hasBrowserPlugin ? `tests/unit/maths.spec` : 'tests/maths.spec'
    await this.#writeFile(`${destination}.${this.#getExtension()}`, content)

    if (this.#hasBrowserPlugin) {
      const browserSample = await this.#edge.render('browser-test-sample')
      await this.#writeFile(`tests/browser/browser.spec.${this.#getExtension()}`, browserSample)
    }
  }

  /**
   * Returns the file extensions based upon the selected
   * project type
   */
  #getExtension() {
    return this.projectType === 'typescript' ? 'ts' : 'js'
  }

  /**
   * Write a file relative to the project root
   * Also creates the directories if missing
   */
  async #writeFile(filePath: string, contents: string, overwrite = false) {
    const absoluteFilePath = join(this.destination, filePath)
    const dir = dirname(absoluteFilePath)

    if (!overwrite && existsSync(absoluteFilePath)) {
      this.logger.action(`create ${filePath}`).skipped('File already exists')
      return
    }

    await mkdir(dir, { recursive: true })
    await writeFile(absoluteFilePath, contents)
    this.logger.action(`create ${filePath}`).succeeded()
  }

  /**
   * Install given packages
   */
  async #installPackages(packages: string[]) {
    if (InstallJapa.#isPackageInstallFaked) {
      return
    }

    await installPackage(packages, {
      cwd: this.destination,
      dev: true,
      packageManager: this.packageManager,
    })
  }

  /**
   * Create a new package.json file
   */
  async #createNewPkgJson(name: string, testScript: string) {
    const content = {
      name: name,
      type: 'module',
      description: '',
      main: 'index.js',
      scripts: { test: testScript },
      version: '0.0.0',
    }

    await this.#writeFile('package.json', JSON.stringify(content, null, 2))
  }

  /**
   * Create or update the package.json file based upon the user selections
   */
  async #createOrUpdatePkgJson() {
    const pkgJsonPath = join(this.destination, 'package.json')

    const testScript =
      this.projectType === 'typescript'
        ? 'node --import ts-node-maintained/register/esm --enable-source-maps bin/test.ts'
        : 'node bin/test.js'

    /**
     * Create a new package.json file when missing
     */
    if (!existsSync(pkgJsonPath)) {
      await this.#createNewPkgJson(basename(this.destination), testScript)
      await this.#installPackages([
        ...this.#packageToInstall.map((pkg) => `${pkg}@latest`),
        'ts-node-maintained',
        '@swc/core',
        'typescript',
      ])

      return
    }

    /**
     * Update existing package.json file
     */
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8'))
    pkgJson.type = 'module'
    pkgJson.scripts = {
      ...pkgJson.scripts,
      test: testScript,
    }

    await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2))
    this.logger.action('update package.json').succeeded()
    await this.#installPackages(this.#packageToInstall.map((pkg) => pkg + '@latest'))
  }

  /**
   * Create or update the package.json file based upon the user selections
   */

  async #createOrUpdateTSconfig() {
    const tsConfigPath = join(this.destination, 'tsconfig.json')

    /**
     * Create a new tsconfig.json file when missing
     */
    if (!existsSync(tsConfigPath)) {
      await this.#writeFile(
        'tsconfig.json',
        JSON.stringify(
          {
            compilerOptions: {
              module: 'NodeNext',
            },
          },
          null,
          2
        )
      )
      return
    }

    /**
     * Update existing tsconfig.json file
     */
    const tsConfigJson = JSON.parse(await readFile(tsConfigPath, 'utf-8'))
    tsConfigJson.compilerOptions = {
      ...tsConfigJson.compilerOptions,
      module: 'NodeNext',
    }

    await writeFile(tsConfigPath, JSON.stringify(tsConfigJson, null, 2))
    this.logger.action('update tsconfig.json').succeeded()
  }

  /**
   * Print final instructions to the user
   */
  #printSuccessSticker() {
    const projectRootRelativeToCwd = relative(process.cwd(), this.destination)

    const sticker = this.ui.sticker().heading('Japa setup complete 🧪')
    if (projectRootRelativeToCwd) {
      sticker.add(`> cd ${projectRootRelativeToCwd}`)
    }
    sticker.add(`> ${this.packageManager} run test`)
    sticker.render()
  }

  /**
   * The prepare lifecycle hook to setup the initial state
   */
  async prepare() {
    this.#printTitle()
    if (!this.packageManager) {
      this.packageManager = detectPackageManager()?.name || 'npm'
    }
    if (!this.destination) {
      this.destination = process.cwd()
    }
  }

  /**
   * The interact lifecycle hook to trigger prompts
   */
  async interact() {
    if (!this.projectType) {
      this.projectType = await this.prompt.choice('Select the project type', PROJECT_TYPES, {
        validate: (value) => !!value,
      })
    }

    if (!this.plugins) {
      this.plugins = []
      await this.#promptAssertionLibrary()
      await this.#promptAdditionalPlugins()
    }

    if (this.sampleTestFile === undefined) {
      this.sampleTestFile = await this.prompt.confirm('Want us to create a sample test?')
    }
  }

  /**
   * The run method is invoked by ace after the prepare
   * and the interact methods
   */
  async run() {
    await this.prepare()
    await this.interact()

    /**
     * If no plugins were selected
     */
    if (!this.plugins) {
      this.plugins = []
    }

    /**
     * Ensure the project type was defined
     */
    if (!this.projectType) {
      this.exitCode = 1
      this.logger.error(
        'Missing project type. Make sure to define it using the "--project-type" flag'
      )
      return
    }

    /**
     * Invalid mentioned project type
     */
    if (!PROJECT_TYPES.find(({ name }) => this.projectType === name)) {
      this.exitCode = 1
      this.logger.error('Invalid project type. It must be either "javascript" or "typescript"')
      return
    }

    this.#processSelectedPlugins()

    /**
     * Create the japa configuration file
     */
    const result = await this.#edge.render('test-file', {
      imports: this.#configFile.imports,
      pluginsList: this.#configFile.plugins,
      fileExtension: this.#getExtension(),
      hasBrowserClientPlugin: this.#hasBrowserPlugin,
    })
    await this.#writeFile(`bin/test.${this.#getExtension()}`, result)

    /**
     * Create the sample test files
     */
    if (this.sampleTestFile) {
      await this.#createSampleTestFiles()
    }

    /**
     * Create or update the package.json file with test script
     * and install dependencies
     */
    await this.#createOrUpdatePkgJson()

    /**
     * Create or update the tsconfig.json file
     * if ts preset is selected
     */
    if (this.projectType === 'typescript') {
      await this.#createOrUpdateTSconfig()
    }

    this.#printSuccessSticker()
  }
}
