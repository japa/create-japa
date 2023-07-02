/*
 * @japa/create-japa
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Kernel } from '@adonisjs/ace'
import { InstallJapa } from './src/install_japa.js'

Kernel.defaultCommand = InstallJapa
export const kernel = Kernel.create()
