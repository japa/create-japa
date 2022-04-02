/*
 * create-japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { EOL } from 'os'
import { join } from 'path'
import gradient from 'gradient-string'
import log from 'mrm-core/src/util/log'
import { Prompt } from '@poppinss/prompts'
import { logger, icons } from '@poppinss/cliui'
import { packageJson, template, install } from 'mrm-core'

/**
 * Title in ASCII ART
 */
const TITLE = Buffer.from(
  'ICAgX19fICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfICAgICAgICAgICAgCiAgfF8gIHwgICAgICAgICAgICAgICAgICAgICAgICAgICB8IHwgICAgICAgICAgIAogICAgfCB8IF9fIF8gXyBfXyAgIF9fIF8gICAgICAgIF9ffCB8IF9fX19fICAgX18KICAgIHwgfC8gX2AgfCAnXyBcIC8gX2AgfCAgICAgIC8gX2AgfC8gXyBcIFwgLyAvCi9cX18vIC8gKF98IHwgfF8pIHwgKF98IHwgIF8gIHwgKF98IHwgIF9fL1wgViAvIApcX19fXy8gXF9fLF98IC5fXy8gXF9fLF98IChfKSAgXF9fLF98XF9fX3wgXF8vICAKICAgICAgICAgICAgfCB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIHxffCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA==',
  'base64'
).toString()

const REPORTER_CHOICES = [
  {
    name: '@japa/spec-reporter' as const,
    hint: '(Spec reporter)',
    importCall() {
      return `import { specReporter } from '${this.name}'`
    },
    requireCall() {
      return `const { specReporter } = require('${this.name}')`
    },
    reporterCall: `specReporter()`,
  },
]

const ASSERTION_CHOICES = [
  {
    name: '@japa/assert' as const,
    hint: '(Chai.js assert)',
    importCall() {
      return `import { assert } from '${this.name}'`
    },
    types: {
      importCall() {
        return ''
      },
      tsContextProperties: [],
    },
    requireCall() {
      return `const { assert } = require('${this.name}')`
    },
    assertionPlugin: 'assert',
    assertionPluginCall: 'assert.equal(2 + 2, 4)',
    pluginCall: `assert()`,
  },
  {
    name: '@japa/expect' as const,
    hint: '(Jest expect)',
    types: {
      importCall() {
        return ''
      },
      tsContextProperties: [],
    },
    importCall() {
      return `import { expect } from '${this.name}'`
    },
    requireCall() {
      return `const { expect } = require('${this.name}')`
    },
    assertionPlugin: 'expect',
    assertionPluginCall: 'expect(2 + 2).toEqual(4)',
    pluginCall: `expect()`,
  },
  {
    name: 'None' as const,
    hint: '',
  },
]

const ADDITIONAL_PLUGINS = [
  {
    name: '@japa/run-failed-tests' as const,
    hint: '(A plugin to run only failed tests)',
    importCall() {
      return `import { runFailedTests } from '${this.name}'`
    },
    requireCall() {
      return `const { runFailedTests } = require('${this.name}')`
    },
    pluginCall: `runFailedTests()`,
  },
]

const PROJECT_TYPES = [
  {
    name: 'TypeScript' as const,
    importerFunctionCall: '(filePath) => import(filePath)',
  },
  {
    name: 'JavaScript ESM' as const,
    importerFunctionCall: '(filePath) => import(filePath)',
  },
  {
    name: 'JavaScript' as const,
    importerFunctionCall: '(filePath) => require(filePath)',
  },
]

const RUNNER = {
  importCall() {
    return `import { processCliArgs, configure, run } from '@japa/runner'`
  },
  requireCall() {
    return `const { processCliArgs, configure, run } = require('@japa/runner')`
  },
}

/**
 * Converts an array of lines to a flat string
 */
function toNewLine(lines: string[], indentation: number = 0) {
  const spaces = new Array(indentation + 1).join(' ')
  return `${lines.map((line) => `${spaces}${line}`).join(EOL)}${EOL}`
}

/**
 * Disables the hardcoded mrm-core logger
 */
function disableLogger() {
  function noop() {}
  log.info = noop
  log.removed = noop
  log.added = noop
}

/**
 * Setup Japa ❤️
 */
export async function setup() {
  disableLogger()

  console.log('')
  console.log(gradient.pastel.multiline(TITLE))
  console.log('')

  /**
   * Prompt to select a reporter. One reporter is required
   */
  const reporters = await new Prompt().multiple('Select the tests reporter', REPORTER_CHOICES, {
    validate: (selections) => {
      return !selections.length ? 'Select a reporter to continue' : true
    },
  })

  /**
   * Prompt to select an assertion library. Assertion library
   * is optional
   */
  const assertionLibrary = await new Prompt().choice(
    'Select the assertion library',
    ASSERTION_CHOICES
  )

  /**
   * Prompt to select additional plugins
   */
  const plugins = await new Prompt().multiple('Select additional plugins', ADDITIONAL_PLUGINS)

  /**
   * Prompt to select project style
   */
  const projectType = await new Prompt().choice('Select the project type', PROJECT_TYPES)

  /**
   * Should we create a sample project?
   */
  const createSampleTest = await new Prompt().confirm('Want us to create a sample test?')

  const fileExtension = projectType === 'TypeScript' ? 'ts' : 'js'
  const pluginsList: string[] = []
  const reportersList: string[] = []
  const imports: string[] = [
    projectType === 'JavaScript' ? RUNNER.requireCall() : RUNNER.importCall(),
  ]
  const tsContextProperties: string[] = []
  const tsTestProperties: string[] = []
  const tsImports: string[] = [`import '@japa/runner'`]
  const packagesToInstall: string[] = ['@japa/runner']

  const testFileName = `bin/test.${fileExtension}`
  const typesFileName = 'bin/japaTypes.ts'

  const sampleTestFileName =
    projectType === 'TypeScript' ? 'tests/maths.spec.ts' : 'tests/maths.spec.js'
  const sampleTestTemplateName =
    projectType === 'JavaScript' ? 'maths-cjs.spec.txt' : 'maths-esm.spec.txt'

  let assertionPlugin: undefined | string
  let assertionPluginCall: undefined | string
  const { importerFunctionCall } = PROJECT_TYPES.find(({ name }) => name === projectType) || {}

  /**
   * Collect import calls for reporters
   */
  reporters.forEach((reporter) => {
    const reporterMatch = REPORTER_CHOICES.find(({ name }) => name === reporter)!
    packagesToInstall.push(reporter)
    imports.push(
      projectType === 'JavaScript' ? reporterMatch.requireCall() : reporterMatch.importCall()
    )
    reportersList.push(reporterMatch.reporterCall)
  })

  /**
   * Collect import calls for assertion packages
   */
  if (assertionLibrary !== 'None') {
    const assertionMatch = ASSERTION_CHOICES.find(({ name }) => name === assertionLibrary)!
    packagesToInstall.push(assertionLibrary)
    imports.push(
      projectType === 'JavaScript' ? assertionMatch.requireCall!() : assertionMatch.importCall!()
    )

    if (assertionMatch.types) {
      const importCall = assertionMatch.types.importCall()
      importCall && tsImports.push(importCall)
      if (assertionMatch.types.tsContextProperties) {
        tsContextProperties.push(...assertionMatch.types.tsContextProperties)
      }
    }

    pluginsList.push(assertionMatch.pluginCall!)
    assertionPlugin = assertionMatch.assertionPlugin
    assertionPluginCall = assertionMatch.assertionPluginCall
  }

  /**
   * Collect import calls for selected plugins
   */
  plugins.forEach((plugin) => {
    const promptMatch = ADDITIONAL_PLUGINS.find(({ name }) => name === plugin)!
    packagesToInstall.push(plugin)
    imports.push(
      projectType === 'JavaScript' ? promptMatch.requireCall() : promptMatch.importCall()
    )
    pluginsList.push(promptMatch.pluginCall)
  })

  console.log('')

  /**
   * Create test file
   */
  const testFile = template(testFileName, join(__dirname, './templates/testfile.txt'))

  testFile.apply({
    imports: imports.length
      ? `${toNewLine(imports.sort((a, b) => a.length - b.length))}${EOL}`
      : '',
    extension: fileExtension,
    pluginsList: pluginsList.join(', '),
    reportersList: reportersList.join(', '),
    importerFunctionCall,
  })

  if (!testFile.exists()) {
    testFile.save()
    logger.action('create').succeeded(testFileName)
  } else {
    logger.action('create').skipped(testFileName, 'File already exists')
  }

  /**
   * Create "japaTypes.ts" file when using typescript
   */
  if (projectType === 'TypeScript') {
    const typesFile = template(typesFileName, join(__dirname, './templates/testtypes.txt'))
    typesFile.apply({
      contextProperties: tsContextProperties.length ? `${toNewLine(tsContextProperties, 2)}  ` : '',
      testProperties: tsTestProperties.length ? `${toNewLine(tsTestProperties, 2)}  ` : '',
      imports: tsImports.length ? `${toNewLine(tsImports)}${EOL}` : '',
    })

    if (!typesFile.exists()) {
      typesFile.save()
      logger.action('create').succeeded(typesFileName)
    } else {
      logger.action('create').skipped(typesFileName, 'File already exists')
    }
  }

  /**
   * Create a sample test for the user
   */
  if (createSampleTest) {
    const sampleTestFile = template(
      sampleTestFileName,
      join(__dirname, `./templates/${sampleTestTemplateName}`)
    )

    sampleTestFile.apply({
      assertionPlugin: assertionPlugin ? `{ ${assertionPlugin} }` : '',
      assertionPluginCall: assertionPluginCall ? `${toNewLine([assertionPluginCall], 2)}  ` : '',
    })

    if (!sampleTestFile.exists()) {
      sampleTestFile.save()
      logger.action('create').succeeded(sampleTestFileName)
    } else {
      logger.action('create').skipped(sampleTestFileName, 'File already exists')
    }
  }

  /**
   * Create empty package.json file if one doesn't exists already
   */
  const pkg = packageJson()
  if (!pkg.exists()) {
    if (projectType === 'JavaScript ESM') {
      pkg.set('type', 'module')
    }
    pkg.save()
    logger.action('create').succeeded('package.json')
  }

  console.log('')
  const response = install(packagesToInstall)

  if (response) {
    console.log('')
  }

  if (!response || response.status === 0) {
    console.log(logger.colors.green(`${icons.tick} Configured japa successfully`))
    console.log(
      `${icons.pointer} Run ${logger.colors
        .dim()
        .underline(`"node ${testFileName}"`)} to execute tests`
    )
  } else {
    console.log(logger.colors.red(`${icons.cross} Packages installation failed`))
  }
}
