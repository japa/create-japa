/*
 * @japa/create-japa
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { PluginChoice } from './types.js'

export const PLUGINS = [
  {
    name: '@japa/assert',
    hint: '(Chai.js assert)',
    namedImport: 'assert',
    importPath: '@japa/assert',
    packagesToInstall: ['@japa/assert'],
  },
  {
    name: '@japa/expect',
    hint: '(Jest expect)',
    namedImport: 'expect',
    importPath: '@japa/expect',
    packagesToInstall: ['@japa/expect'],
  },
  {
    name: '@japa/api-client',
    hint: '(Test API endpoints over HTTP)',
    namedImport: 'apiClient',
    importPath: '@japa/api-client',
    parameters: "'http://localhost:3333'",
    packagesToInstall: ['@japa/api-client'],
  },
  {
    name: '@japa/file-system',
    hint: '(Test file system)',
    namedImport: 'fileSystem',
    importPath: '@japa/file-system',
    packagesToInstall: ['@japa/file-system'],
  },
  {
    name: '@japa/expect-type',
    hint: '(Typescript types testing)',
    namedImport: 'expectTypeOf',
    importPath: '@japa/expect-type',
    packagesToInstall: ['@japa/expect-type'],
  },
  {
    name: '@japa/snapshot',
    hint: '(Snapshot testing)',
    namedImport: 'snapshot',
    importPath: '@japa/snapshot',
    packagesToInstall: ['@japa/snapshot'],
  },
  {
    name: '@japa/browser-client',
    hint: '(Browser testing)',
    namedImport: 'browserClient',
    importPath: '@japa/browser-client',
    parameters: `{ runInSuites: ['browser'] }`,
    packagesToInstall: ['playwright', '@japa/browser-client'],
  },
] as PluginChoice[]

export const ASSERTION_CHOICES = [
  PLUGINS.find((plugin) => plugin.name === '@japa/assert')!,
  PLUGINS.find((plugin) => plugin.name === '@japa/expect')!,
]

export const ADDITIONAL_PLUGINS = [
  PLUGINS.find((plugin) => plugin.name === '@japa/api-client')!,
  PLUGINS.find((plugin) => plugin.name === '@japa/file-system')!,
  PLUGINS.find((plugin) => plugin.name === '@japa/expect-type')!,
  PLUGINS.find((plugin) => plugin.name === '@japa/snapshot')!,
  PLUGINS.find((plugin) => plugin.name === '@japa/browser-client')!,
]

export const PROJECT_TYPES = [
  { name: 'typescript' as const, message: 'TypeScript' },
  { name: 'javascript' as const, message: 'JavaScript' },
]
