import type {
  MailCatalog,
  MailFolder,
  MailMessage,
} from '../core/types/mail'

import {
  escapeHtml,
} from '../core/utilities/html'

interface MailAppElements {
  window: HTMLElement
  folderTitle: HTMLElement
  folders: HTMLElement
  messages: HTMLElement
  reader: HTMLElement
  search: HTMLInputElement
  status: HTMLElement
  minimizeButton: HTMLButtonElement
  maximizeButton: HTMLButtonElement
  closeButton: HTMLButtonElement
}

function getFolderMessages(
  catalog: MailCatalog,
  folderId: string,
): MailMessage[] {
  return catalog.messages
    .filter(
      (message) =>
        message.folderId === folderId,
    )
    .sort(
      (left, right) =>
        right.sentAt.localeCompare(
          left.sentAt,
        ),
    )
}

function getUnreadCount(
  catalog: MailCatalog,
  folderId: string,
): number {
  return getFolderMessages(
    catalog,
    folderId,
  ).filter(
    (message) =>
      message.unread,
  ).length
}

function formatMessageDate(
  sentAt: string,
): string {
  const date =
    new Date(sentAt)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return sentAt
  }

  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}

function getFolderIcon(
  folder: MailFolder,
): string {
  if (
    folder.kind === 'sent'
  ) {
    return '➤'
  }

  if (
    folder.kind === 'drafts'
  ) {
    return '✎'
  }

  if (
    folder.kind === 'spam'
  ) {
    return '!'
  }

  if (
    folder.kind === 'trash'
  ) {
    return '⌫'
  }

  return '✉'
}

function renderFolders(
  catalog: MailCatalog,
  selectedFolderId: string,
): string {
  return [...catalog.folders]
    .sort(
      (left, right) =>
        left.order - right.order,
    )
    .map((folder) => {
      const messages =
        getFolderMessages(
          catalog,
          folder.id,
        )

      const unreadCount =
        getUnreadCount(
          catalog,
          folder.id,
        )

      return `
        <button
          class="
            mail-folder
            ${
              folder.id ===
              selectedFolderId
                ? 'is-active'
                : ''
            }
          "
          type="button"
          data-mail-folder-id="${escapeHtml(
            folder.id,
          )}"
        >
          <span
            class="
              mail-folder__icon
              mail-folder__icon--${escapeHtml(
                folder.kind,
              )}
            "
            aria-hidden="true"
          >
            ${getFolderIcon(folder)}
          </span>

          <span class="mail-folder__name">
            ${escapeHtml(folder.name)}
          </span>

          ${
            unreadCount > 0
              ? `
                <strong
                  class="
                    mail-folder__unread
                  "
                >
                  ${unreadCount}
                </strong>
              `
              : `
                <span
                  class="
                    mail-folder__count
                  "
                >
                  ${messages.length}
                </span>
              `
          }
        </button>
      `
    })
    .join('')
}

function renderMessageList(
  messages: MailMessage[],
  selectedMessageId: string | null,
): string {
  if (messages.length === 0) {
    return `
      <div class="mail-empty">
        <div
          class="mail-empty__icon"
          aria-hidden="true"
        >
          ✉
        </div>

        <strong>
          В этой папке нет писем
        </strong>

        <span>
          Сообщения появятся здесь
          после наполнения почтового ящика.
        </span>
      </div>
    `
  }

  return messages
    .map(
      (message) => `
        <button
          class="
            mail-message
            ${
              message.unread
                ? 'mail-message--unread'
                : ''
            }
            ${
              message.id ===
              selectedMessageId
                ? 'is-selected'
                : ''
            }
          "
          type="button"
          data-mail-message-id="${escapeHtml(
            message.id,
          )}"
        >
          <span class="mail-message__top">
            <strong>
              ${escapeHtml(
                message.from.name ||
                message.from.email,
              )}
            </strong>

            <time>
              ${escapeHtml(
                formatMessageDate(
                  message.sentAt,
                ),
              )}
            </time>
          </span>

          <span class="mail-message__subject">
            ${escapeHtml(
              message.subject,
            )}
          </span>

          <span class="mail-message__preview">
            ${escapeHtml(
              message.preview,
            )}
          </span>

          ${
            message.attachments &&
            message.attachments.length > 0
              ? `
                <span
                  class="
                    mail-message__attachment
                  "
                >
                  Скрепка ·
                  ${message.attachments.length}
                </span>
              `
              : ''
          }
        </button>
      `,
    )
    .join('')
}

function renderEmptyReader(): string {
  return `
    <div class="mail-reader-empty">
      <div aria-hidden="true">
        ✉
      </div>

      <strong>
        Выберите письмо
      </strong>

      <span>
        Содержимое выбранного сообщения
        появится в этой области.
      </span>
    </div>
  `
}

function renderMessageReader(
  message: MailMessage,
): string {
  const recipients =
    message.to
      .map(
        (address) =>
          address.name ||
          address.email,
      )
      .join(', ')

  return `
    <div class="mail-reader__mobile-header">
      <button
        type="button"
        data-mail-reader-back
      >
        ← К списку
      </button>
    </div>

    <article class="mail-letter">
      <header class="mail-letter__header">
        <span class="mail-letter__label">
          Электронное сообщение
        </span>

        <h1>
          ${escapeHtml(
            message.subject,
          )}
        </h1>

        <dl class="mail-letter__details">
          <div>
            <dt>От</dt>

            <dd>
              <strong>
                ${escapeHtml(
                  message.from.name,
                )}
              </strong>

              <span>
                ${escapeHtml(
                  message.from.email,
                )}
              </span>
            </dd>
          </div>

          <div>
            <dt>Кому</dt>

            <dd>
              ${escapeHtml(recipients)}
            </dd>
          </div>

          <div>
            <dt>Дата</dt>

            <dd>
              ${escapeHtml(
                formatMessageDate(
                  message.sentAt,
                ),
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div class="mail-letter__body">
        ${message.body
          .map(
            (paragraph) => `
              <p>
                ${escapeHtml(paragraph)}
              </p>
            `,
          )
          .join('')}
      </div>

      ${
        message.attachments &&
        message.attachments.length > 0
          ? `
            <section class="mail-letter__attachments">
              <h2>
                Вложения
              </h2>

              ${message.attachments
                .map(
                  (attachment) => `
                    <div
                      class="
                        mail-attachment
                      "
                    >
                      <span
                        aria-hidden="true"
                      >
                        ▤
                      </span>

                      <strong>
                        ${escapeHtml(
                          attachment.name,
                        )}
                      </strong>
                    </div>
                  `,
                )
                .join('')}
            </section>
          `
          : ''
      }
    </article>
  `
}

function closeSystemMenu(
  root: HTMLDivElement,
): void {
  const menu =
    root.querySelector<HTMLElement>(
      '[data-system-menu]',
    )

  const button =
    root.querySelector<HTMLButtonElement>(
      '[data-system-menu-button]',
    )

  if (menu) {
    menu.hidden = true
  }

  button?.setAttribute(
    'aria-expanded',
    'false',
  )
}

export function attachMailApp(
  root: HTMLDivElement,
  catalog: MailCatalog,
): void {
  const desktopShell =
    root.querySelector<HTMLElement>(
      '[data-desktop-shell]',
    )

  if (!desktopShell) {
    throw new Error(
      'Не найден рабочий стол для приложения почты.',
    )
  }

  let elements:
    MailAppElements | null = null

  let selectedFolderId =
    [...catalog.folders]
      .sort(
        (left, right) =>
          left.order - right.order,
      )[0]?.id ??
    'inbox'

  let selectedMessageId:
    string | null = null

  const taskbarButton =
    root.querySelector<HTMLButtonElement>(
      '[data-taskbar-open][data-target-id="mail"]',
    )

  const setTaskbarState = (
    isOpen: boolean,
    isActive: boolean,
  ): void => {
    if (!taskbarButton) {
      return
    }

    taskbarButton.classList.toggle(
      'taskbar__application--open',
      isOpen,
    )

    taskbarButton.classList.toggle(
      'taskbar__application--active',
      isActive,
    )
  }

  const renderReader =
    (): void => {
      if (!elements) {
        return
      }

      const message =
        catalog.messages.find(
          (item) =>
            item.id ===
            selectedMessageId,
        )

      elements.reader.innerHTML =
        message
          ? renderMessageReader(message)
          : renderEmptyReader()

      elements.window.classList.toggle(
        'mail-window--reading',
        Boolean(message),
      )
    }

  const renderCurrentFolder =
    (): void => {
      if (!elements) {
        return
      }

      const folder =
        catalog.folders.find(
          (item) =>
            item.id ===
            selectedFolderId,
        )

      const query =
        elements.search.value
          .trim()
          .toLocaleLowerCase('ru-RU')

      const messages =
        getFolderMessages(
          catalog,
          selectedFolderId,
        ).filter((message) => {
          if (!query) {
            return true
          }

          return [
            message.from.name,
            message.from.email,
            message.subject,
            message.preview,
          ].some(
            (value) =>
              value
                .toLocaleLowerCase(
                  'ru-RU',
                )
                .includes(query),
          )
        })

      if (
        selectedMessageId &&
        !messages.some(
          (message) =>
            message.id ===
            selectedMessageId,
        )
      ) {
        selectedMessageId = null
      }

      elements.folderTitle.textContent =
        folder?.name ??
        'Почта'

      elements.folders.innerHTML =
        renderFolders(
          catalog,
          selectedFolderId,
        )

      elements.messages.innerHTML =
        renderMessageList(
          messages,
          selectedMessageId,
        )

      elements.status.textContent =
        query
          ? `Найдено писем: ${messages.length}`
          : `Писем: ${messages.length}`

      renderReader()
    }

  const createWindow =
    (): MailAppElements => {
      const windowElement =
        document.createElement(
          'section',
        )

      windowElement.className =
        'mail-window'

      windowElement.dataset.mailWindow =
        ''

      windowElement.innerHTML = `
        <header class="mail-titlebar">
          <div class="mail-titlebar__identity">
            <span
              class="mail-titlebar__icon"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="3"
                ></rect>

                <path
                  d="
                    M4 7
                    L12 13
                    L20 7
                  "
                ></path>
              </svg>
            </span>

            <div>
              <strong>
                Почта
              </strong>

              <span>
                ${escapeHtml(
                  catalog.ownerName,
                )}
              </span>
            </div>
          </div>

          <div class="mail-titlebar__controls">
            <button
              type="button"
              title="Свернуть"
              aria-label="Свернуть"
              data-mail-minimize
            >
              —
            </button>

            <button
              type="button"
              title="Развернуть"
              aria-label="Развернуть"
              data-mail-maximize
            >
              <span
                class="
                  mail-control-square
                "
                aria-hidden="true"
              ></span>
            </button>

            <button
              class="
                mail-titlebar__close
              "
              type="button"
              title="Закрыть"
              aria-label="Закрыть"
              data-mail-close
            >
              ×
            </button>
          </div>
        </header>

        <div class="mail-toolbar">
          <div class="mail-toolbar__brand">
            <span aria-hidden="true">
              ✉
            </span>

            <strong
              data-mail-folder-title
            >
              Входящие
            </strong>
          </div>

          <label class="mail-search">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              autocomplete="off"
              placeholder="Поиск по почте"
              aria-label="Поиск по почте"
              data-mail-search
            />
          </label>

          <div class="mail-account">
            <span aria-hidden="true">
              ВК
            </span>

            <div>
              <strong>
                ${escapeHtml(
                  catalog.ownerName,
                )}
              </strong>

              <small>
                ${escapeHtml(
                  catalog.accountAddress ||
                  'Локальная почта',
                )}
              </small>
            </div>
          </div>
        </div>

        <div class="mail-layout">
          <aside
            class="mail-folders"
            data-mail-folders
          ></aside>

          <section class="mail-list">
            <header class="mail-list__header">
              <strong>
                Сообщения
              </strong>

              <span>
                По дате
              </span>
            </header>

            <div
              class="mail-list__content"
              data-mail-messages
            ></div>
          </section>

          <section
            class="mail-reader"
            data-mail-reader
          ></section>
        </div>

        <footer class="mail-statusbar">
          <span
            data-mail-status
          ></span>

          <span>
            Локальное хранилище
          </span>
        </footer>
      `

      desktopShell.append(
        windowElement,
      )

      const result:
        MailAppElements = {
          window:
            windowElement,

          folderTitle:
            windowElement
              .querySelector<HTMLElement>(
                '[data-mail-folder-title]',
              )!,

          folders:
            windowElement
              .querySelector<HTMLElement>(
                '[data-mail-folders]',
              )!,

          messages:
            windowElement
              .querySelector<HTMLElement>(
                '[data-mail-messages]',
              )!,

          reader:
            windowElement
              .querySelector<HTMLElement>(
                '[data-mail-reader]',
              )!,

          search:
            windowElement
              .querySelector<HTMLInputElement>(
                '[data-mail-search]',
              )!,

          status:
            windowElement
              .querySelector<HTMLElement>(
                '[data-mail-status]',
              )!,

          minimizeButton:
            windowElement
              .querySelector<HTMLButtonElement>(
                '[data-mail-minimize]',
              )!,

          maximizeButton:
            windowElement
              .querySelector<HTMLButtonElement>(
                '[data-mail-maximize]',
              )!,

          closeButton:
            windowElement
              .querySelector<HTMLButtonElement>(
                '[data-mail-close]',
              )!,
        }

      result.folders.addEventListener(
        'click',
        (event) => {
          const target =
            event.target

          if (
            !(target instanceof Element)
          ) {
            return
          }

          const button =
            target.closest<HTMLButtonElement>(
              '[data-mail-folder-id]',
            )

          const folderId =
            button?.dataset.mailFolderId

          if (!folderId) {
            return
          }

          selectedFolderId =
            folderId

          selectedMessageId =
            null

          result.search.value =
            ''

          renderCurrentFolder()
        },
      )

      result.messages.addEventListener(
        'click',
        (event) => {
          const target =
            event.target

          if (
            !(target instanceof Element)
          ) {
            return
          }

          const button =
            target.closest<HTMLButtonElement>(
              '[data-mail-message-id]',
            )

          const messageId =
            button?.dataset.mailMessageId

          if (!messageId) {
            return
          }

          selectedMessageId =
            messageId

          renderCurrentFolder()
        },
      )

      result.reader.addEventListener(
        'click',
        (event) => {
          const target =
            event.target

          if (
            !(target instanceof Element)
          ) {
            return
          }

          if (
            !target.closest(
              '[data-mail-reader-back]',
            )
          ) {
            return
          }

          selectedMessageId =
            null

          renderCurrentFolder()
        },
      )

      result.search.addEventListener(
        'input',
        renderCurrentFolder,
      )

      result.minimizeButton
        .addEventListener(
          'click',
          () => {
            result.window.hidden =
              true

            setTaskbarState(
              true,
              false,
            )
          },
        )

      result.maximizeButton
        .addEventListener(
          'click',
          () => {
            const isMaximized =
              result.window.classList
                .toggle(
                  'mail-window--maximized',
                )

            result.maximizeButton
              .setAttribute(
                'title',
                isMaximized
                  ? 'Восстановить размер'
                  : 'Развернуть',
              )
          },
        )

      result.closeButton
        .addEventListener(
          'click',
          () => {
            result.window.remove()

            elements = null

            setTaskbarState(
              false,
              false,
            )
          },
        )

      return result
    }

  const openWindow = (): void => {
    if (!elements) {
      elements =
        createWindow()

      renderCurrentFolder()
    } else {
      elements.window.hidden =
        false
    }

    setTaskbarState(
      true,
      true,
    )

    closeSystemMenu(root)
  }

  const toggleFromTaskbar =
    (): void => {
      if (
        elements &&
        !elements.window.hidden
      ) {
        elements.window.hidden =
          true

        setTaskbarState(
          true,
          false,
        )

        return
      }

      openWindow()
    }

  root.addEventListener(
    'click',
    (event) => {
      const target =
        event.target

      if (
        !(target instanceof Element)
      ) {
        return
      }

      const button =
        target.closest<HTMLButtonElement>(
          `
            [data-desktop-icon],
            [data-menu-open],
            [data-taskbar-open]
          `,
        )

      if (
        button?.dataset.targetId !==
        'mail'
      ) {
        return
      }

      const isDesktopIcon =
        button.hasAttribute(
          'data-desktop-icon',
        )

      const useSingleTap =
        window.matchMedia(
          '(pointer: coarse)',
        ).matches ||
        window.matchMedia(
          '(max-width: 820px)',
        ).matches

      if (
        isDesktopIcon &&
        !useSingleTap
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      if (
        button.hasAttribute(
          'data-taskbar-open',
        )
      ) {
        toggleFromTaskbar()
        return
      }

      openWindow()
    },
    true,
  )

  root.addEventListener(
    'dblclick',
    (event) => {
      const target =
        event.target

      if (
        !(target instanceof Element)
      ) {
        return
      }

      const button =
        target.closest<HTMLButtonElement>(
          '[data-desktop-icon]',
        )

      if (
        button?.dataset.targetId !==
        'mail'
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openWindow()
    },
    true,
  )

  root.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        elements &&
        !elements.window.hidden
      ) {
        elements.window.remove()
        elements = null

        setTaskbarState(
          false,
          false,
        )

        return
      }

      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      ) {
        return
      }

      const target =
        event.target

      if (
        !(target instanceof Element)
      ) {
        return
      }

      const button =
        target.closest<HTMLButtonElement>(
          '[data-desktop-icon]',
        )

      if (
        button?.dataset.targetId !==
        'mail'
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openWindow()
    },
    true,
  )
}