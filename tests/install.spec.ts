/*
 * @japa/create-japa
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { kernel } from '../index.js'
import { InstallJapa } from '../src/install_japa.js'
import { existsSync, mkdirSync } from 'node:fs'

function trapPrompts(command: InstallJapa) {
  command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
  command.prompt.trap('Select additional plugins').replyWith([])
  command.prompt.trap('Select the project type').replyWith('typescript')
  command.prompt.trap('Want us to create a sample test?').replyWith(true)
}

test.group('install', (group) => {
  group.each.setup(() => {
    const projectRoot = process.cwd()
    kernel.ui.switchMode('raw')
    InstallJapa.fakePackageInstall()
    return () => {
      process.chdir(projectRoot)
      kernel.ui.switchMode('normal')
      InstallJapa.restorePackageInstall()
    }
  })

  test('add assertion library import and plugin', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')

    assert.include(fileContent, `import { assert } from '@japa/assert'`)
    assert.include(fileContent, `assert()`)
  })

  test('use expect assertion library', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/expect')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')
    assert.include(fileContent, `import { expect } from '@japa/expect'`)
    assert.include(fileContent, `expect()`)
  })

  test('add additional plugins', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith('@japa/file-system')
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')

    assert.include(fileContent, `import { fileSystem } from '@japa/file-system'`)
    assert.include(fileContent, `fileSystem()`)
  })

  test('additional plugins with parameters', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt
      .trap('Select additional plugins')
      .replyWith(['@japa/api-client', '@japa/browser-client'])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')

    assert.include(fileContent, `import { apiClient } from '@japa/api-client'`)
    assert.include(fileContent, `apiClient('http://localhost:3333')`)

    assert.include(fileContent, `import { browserClient } from '@japa/browser-client'`)
    assert.include(fileContent, `browserClient({ runInSuites: ['browser'] })`)
  })

  test('format plugins if too many on same line', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt
      .trap('Select additional plugins')
      .replyWith(['@japa/api-client', '@japa/browser-client', '@japa/file-system'])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.ts')
    assert.include(content, `   fileSystem(),`)
    assert.include(content, `   apiClient('http://localhost:3333'),`)
    assert.include(content, `   browserClient({ runInSuites: ['browser'] }),`)
  })

  test('configure inside javascript project', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('javascript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    await assert.fileExists('bin/test.js')
  })

  test('configure inside current directory if destination is not set', async ({ assert, fs }) => {
    mkdirSync(fs.basePath, { recursive: true })
    process.chdir(fs.basePath)

    const command = await kernel.create(InstallJapa, [])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('javascript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    assert.isTrue(existsSync('bin/test.js'))
  })

  test('add default files config', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('javascript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.js')
    assert.include(content, `files: ['tests/**/*.spec.js'],`)
  })

  test('add default files config for typescript project', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.ts')
    assert.include(content, `files: ['tests/**/*.spec.ts'],`)
  })

  test('add suites instead of files if browser client is installed', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith(['@japa/browser-client'])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.ts')
    assert.include(content, `suites: [`)
    assert.notInclude(content, `files: ['tests/**/*.spec.ts'],`)
  })

  test('should add a sample test file', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(true)

    await command.exec()

    await assert.fileExists('tests/maths.spec.ts')
    const content = await fs.contents('tests/maths.spec.ts')

    assert.include(content, `assert.equal(1 + 1, 2)`)
  })

  test('should use correct assertion library for sample test file', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/expect')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(true)

    await command.exec()

    await assert.fileExists('tests/maths.spec.ts')
    const content = await fs.contents('tests/maths.spec.ts')

    assert.include(content, `expect(1 + 1).toBe(2)`)
  })

  test('should create suites directories if browser-client is installed', async ({
    assert,
    fs,
  }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith(['@japa/browser-client'])
    command.prompt.trap('Select the project type').replyWith('typescript')
    command.prompt.trap('Want us to create a sample test?').replyWith(true)

    await command.exec()

    await assert.fileExists('tests/unit/maths.spec.ts')
    await assert.fileExists('tests/browser/browser.spec.ts')
  })

  test('should not overwrite existing config file', async ({ assert, fs }) => {
    await fs.create('bin/test.ts', '')

    const command = await kernel.create(InstallJapa, [fs.basePath])

    trapPrompts(command)

    await command.exec()

    const content = await fs.contents('bin/test.ts')
    assert.equal(content, '')

    command.assertLog('cyan(SKIPPED:) create bin/test.ts dim((File already exists))')
  })

  test('should create package.json', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    trapPrompts(command)

    await command.exec()

    await assert.fileExists('package.json')
    const pkg = await fs.contentsJson('package.json')

    assert.deepEqual(pkg.type, 'module')
    assert.deepEqual(pkg.scripts, {
      test: 'node --import ts-node-maintained/register/esm --enable-source-maps bin/test.ts',
    })
  })

  test('should not overwrite existing package.json', async ({ assert, fs }) => {
    await fs.create('package.json', JSON.stringify({ name: 'foo', description: 'blabla' }))

    kernel.ui.switchMode('raw')

    const command = await kernel.create(InstallJapa, [fs.basePath])

    trapPrompts(command)

    await command.exec()

    await assert.fileExists('package.json')
    const pkg = await fs.contentsJson('package.json')

    assert.deepEqual(pkg.type, 'module')
    assert.deepEqual(pkg.scripts, {
      test: 'node --import ts-node-maintained/register/esm --enable-source-maps bin/test.ts',
    })
    assert.deepEqual(pkg.name, 'foo')
    assert.deepEqual(pkg.description, 'blabla')
  })

  test('install dependencies using detected package manager - {agent}')
    .with([
      { agent: 'npm/7.0.0 node/v15.0.0 darwin x64', lockFile: 'package-lock.json' },
      { agent: 'pnpm/5.0.0 node/v15.0.0 darwin x64', lockFile: 'pnpm-lock.yaml' },
      { agent: 'yarn/1.22.5 npm/? node/v15.0.0 darwin x64', lockFile: 'yarn.lock' },
    ])
    .run(async ({ assert, fs }, { agent, lockFile }) => {
      process.env.npm_config_user_agent = agent

      InstallJapa.restorePackageInstall()

      const command = await kernel.create(InstallJapa, [fs.basePath])

      trapPrompts(command)

      await command.exec()
      await assert.fileExists(`${lockFile}`)

      process.env.npm_config_user_agent = undefined
    })
    .disableTimeout()

  test('should create tsconfig.json if ts is selected and no tsconfig exists', async ({
    assert,
    fs,
  }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    trapPrompts(command)

    await command.exec()

    await assert.fileExists('tsconfig.json')
    const config = await fs.contentsJson('tsconfig.json')

    assert.deepEqual(config.compilerOptions.module, 'NodeNext')
  })

  test('should update existing tsconfig.json if exists with correct module setting', async ({
    assert,
    fs,
  }) => {
    await fs.create(
      'tsconfig.json',
      JSON.stringify({ compilerOptions: { target: 'ESNext', lib: ['ESNext'] } })
    )

    kernel.ui.switchMode('raw')

    const command = await kernel.create(InstallJapa, [fs.basePath])

    trapPrompts(command)

    await command.exec()

    await assert.fileExists('tsconfig.json')
    const config = await fs.contentsJson('tsconfig.json')

    assert.deepEqual(config.compilerOptions.target, 'ESNext')
    assert.deepEqual(config.compilerOptions.lib[0], 'ESNext')
    assert.deepEqual(config.compilerOptions.module, 'NodeNext')
  })
})
