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

function trapPrompts(command: InstallJapa) {
  command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
  command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
  command.prompt.trap('Select additional plugins').replyWith([])
  command.prompt.trap('Select the project type').replyWith('TypeScript')
  command.prompt.trap('Want us to create a sample test?').replyWith(true)
}

test.group('install', (group) => {
  group.each.setup(() => {
    kernel.ui.switchMode('raw')
    InstallJapa.fakePackageInstall()
    return () => {
      kernel.ui.switchMode('normal')
      InstallJapa.restorePackageInstall()
    }
  })

  test('dont add reporters config when only spec-reporter is selected', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    await assert.fileExists('bin/test.ts')
    const fileContent = await fs.contents('bin/test.ts')

    assert.notInclude(fileContent, 'reporters: {')
  })

  test('add reporter config when only dot-reporter is selected', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('dot-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')

    assert.include(fileContent, 'reporters: {')
    assert.include(fileContent, `activated: ['dot'],`)
    assert.include(fileContent, `list: [dot()],`)
  })

  test('add assertion library import and plugin', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')

    assert.include(fileContent, `import { assert } from '@japa/assert'`)
    assert.include(fileContent, `assert()`)
  })

  test('use expect assertion library', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/expect')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')
    assert.include(fileContent, `import { expect } from '@japa/expect'`)
    assert.include(fileContent, `expect()`)
  })

  test('add additional plugins', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith('@japa/file-system')
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const fileContent = await fs.contents('bin/test.ts')

    assert.include(fileContent, `import { fileSystem } from '@japa/file-system'`)
    assert.include(fileContent, `fileSystem()`)
  })

  test('additional plugins with parameters', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt
      .trap('Select additional plugins')
      .replyWith(['@japa/api-client', '@japa/browser-client'])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
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

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt
      .trap('Select additional plugins')
      .replyWith(['@japa/api-client', '@japa/browser-client', '@japa/file-system'])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.ts')
    assert.include(content, `   fileSystem(),`)
    assert.include(content, `   apiClient('http://localhost:3333'),`)
    assert.include(content, `   browserClient({ runInSuites: ['browser'] }),`)
  })

  test('output config file as js if javascript project', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('JavaScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    await assert.fileExists('bin/test.js')
  })

  test('add default files config', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('JavaScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.js')
    assert.include(content, `files: ['tests/**/*.spec.js'],`)
  })

  test('add default files config for typescript project', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.ts')
    assert.include(content, `files: ['tests/**/*.spec.ts'],`)
  })

  test('add suites instead of files if browser client is installed', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith(['@japa/browser-client'])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(false)

    await command.exec()

    const content = await fs.contents('bin/test.ts')
    assert.include(content, `suites: [`)
    assert.notInclude(content, `files: ['tests/**/*.spec.ts'],`)
  })

  test('should add a sample test file', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
    command.prompt.trap('Want us to create a sample test?').replyWith(true)

    await command.exec()

    await assert.fileExists('tests/maths.spec.ts')
    const content = await fs.contents('tests/maths.spec.ts')

    assert.include(content, `assert.equal(1 + 1, 2)`)
  })

  test('should use correct assertion library for sample test file', async ({ assert, fs }) => {
    const command = await kernel.create(InstallJapa, [fs.basePath])

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/expect')
    command.prompt.trap('Select additional plugins').replyWith([])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
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

    command.prompt.trap('Select the reporters to use').replyWith('spec-reporter')
    command.prompt.trap('Select the assertion library').replyWith('@japa/assert')
    command.prompt.trap('Select additional plugins').replyWith(['@japa/browser-client'])
    command.prompt.trap('Select the project type').replyWith('TypeScript')
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
      test: 'node --loader ts-node/esm --enable-source-maps bin/test.ts',
    })
  })

  test('should not overwrite existing package.json', async ({ assert, fs }) => {
    await fs.create('package.json', JSON.stringify({ name: 'foo', description: 'blabla' }))

    kernel.ui.switchMode('normal')

    const command = await kernel.create(InstallJapa, [fs.basePath])

    trapPrompts(command)

    await command.exec()

    await assert.fileExists('package.json')
    const pkg = await fs.contentsJson('package.json')

    assert.deepEqual(pkg.type, 'module')
    assert.deepEqual(pkg.scripts, {
      test: 'node --loader ts-node/esm --enable-source-maps bin/test.ts',
    })
    assert.deepEqual(pkg.name, 'foo')
    assert.deepEqual(pkg.description, 'blabla')
  })
})
