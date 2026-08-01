import './styles/variables.css'
import './styles/global.css'
import './styles/boot.css'
import './styles/desktop.css'
import './styles/file-manager.css'
import './styles/document-viewer.css'
import './styles/mail.css'
import './styles/layout.css'
import './styles/states.css'
import './styles/viewers.css'

import {
  loadDefaultCase,
} from './cases/case-loader'

import {
  loadDocumentCatalog,
} from './cases/document-loader'

import {
  loadMailCatalog,
} from './cases/mail-loader'

import {
  loadSystemConfig,
} from './cases/system-loader'

import {
  escapeHtml,
} from './core/utilities/html'

import {
  showBootScreen,
} from './ui/boot-screen'

import {
  showDesktopScreen,
} from './ui/desktop-screen'

import {
  attachDocumentViewer,
} from './ui/document-viewer'

import {
  attachFileManager,
} from './ui/file-manager'

import {
  showLoginScreen,
} from './ui/login-screen'

import {
  attachMailApp,
} from './ui/mail-app'

const appElement =
  document.querySelector<HTMLDivElement>(
    '#app',
  )

if (!appElement) {
  throw new Error(
    'Не найден корневой элемент приложения #app.',
  )
}

const appRoot: HTMLDivElement =
  appElement

function renderStartupError(
  root: HTMLDivElement,
  error: unknown,
): void {
  const message =
    error instanceof Error
      ? error.message
      : 'Неизвестная ошибка.'

  root.innerHTML = `
    <main
      class="
        system-stage
        system-stage--error
      "
    >
      <section
        class="startup-error"
        role="alert"
      >
        <h1>
          Не удалось запустить компьютер
        </h1>

        <p>
          ${escapeHtml(message)}
        </p>

        <p>
          Проверьте файлы конфигурации
          и обновите страницу.
        </p>
      </section>
    </main>
  `
}

async function startApplication(
  root: HTMLDivElement,
): Promise<void> {
  try {
    const [
      systemConfig,
      manifest,
      documentCatalog,
      mailCatalog,
    ] = await Promise.all([
      loadSystemConfig(),
      loadDefaultCase(),
      loadDocumentCatalog(),
      loadMailCatalog(),
    ])

    await showBootScreen(
      root,
      systemConfig,
    )

    await showLoginScreen(
      root,
      systemConfig,
    )

    showDesktopScreen(
      root,
      systemConfig,
    )

    attachFileManager(
      root,
      manifest,
    )

    attachDocumentViewer(
      root,
      manifest,
      documentCatalog,
    )

    attachMailApp(
      root,
      mailCatalog,
    )
  } catch (error: unknown) {
    renderStartupError(
      root,
      error,
    )
  }
}

void startApplication(appRoot)