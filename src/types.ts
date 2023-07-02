/*
 * @japa/create-japa
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type PluginChoice = {
  name: string
  hint?: string
  namedImport: string
  importPath: string
  parameters?: string
  packagesToInstall?: string[]
}
