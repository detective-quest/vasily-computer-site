import { loadDefaultCase } from './case-loader'

import type {
  SystemConfig,
} from '../core/types/system'

import {
  resolvePublicPath,
} from '../core/utilities/public-path'

let systemConfigPromise:
  | Promise<SystemConfig>
  | null = null

function validateSystemConfig(
  config: SystemConfig,
): void {
  if (
    !config.id ||
    !config.profile?.displayName ||
    !config.profile.password ||
    !config.profile.passwordHint ||
    !Array.isArray(config.boot?.messages) ||
    config.boot.messages.length === 0 ||
    !Array.isArray(config.desktop?.icons)
  ) {
    throw new Error(
      'Файл system.json имеет неверную структуру.',
    )
  }
}

async function loadSystemConfigFromFiles():
  Promise<SystemConfig> {
  const manifest = await loadDefaultCase()

  const requestPath = resolvePublicPath(
    `content/${manifest.id}/system.json`,
  )

  const response = await fetch(
    requestPath,
    {
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить ${requestPath}. Код ответа: ${response.status}.`,
    )
  }

  const config =
    (await response.json()) as SystemConfig

  validateSystemConfig(config)

  if (config.id !== manifest.id) {
    throw new Error(
      'Идентификаторы manifest.json и system.json не совпадают.',
    )
  }

  return config
}

export function loadSystemConfig():
  Promise<SystemConfig> {
  if (!systemConfigPromise) {
    systemConfigPromise =
      loadSystemConfigFromFiles().catch(
        (error: unknown) => {
          systemConfigPromise = null

          throw error
        },
      )
  }

  return systemConfigPromise
}