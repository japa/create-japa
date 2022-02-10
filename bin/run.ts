#!/usr/bin/env node

/*
 * create-japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { setup } from '../index'

setup().catch((error) => console.log({ error }))
