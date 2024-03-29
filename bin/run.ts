#!/usr/bin/env node

/*
 * @japa/create-japa
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { kernel } from '../index.js'

kernel.handle(['create-japa', ...process.argv.slice(2)]).catch((error) => {
  console.error(error.stack)
})
