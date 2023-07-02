import { assert } from '@japa/assert'
import { fileSystem } from '@japa/file-system'
import { configure, processCLIArgs, run } from '@japa/runner'

processCLIArgs(process.argv.slice(2))
configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert(), fileSystem({ autoClean: true, basePath: './tmp' })],
})

run()
