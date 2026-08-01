import type {
  SystemConfig,
  SystemDesktopIcon,
} from '../core/types/system'

import {
  escapeHtml,
} from '../core/utilities/html'

const LOGIN_STORAGE_KEY =
  'vasily-computer:unlocked:v1'

let noticeTimerId:
  number | null = null

type DesktopIconKind =
  | 'documents'
  | 'work'
  | 'personal'
  | 'mail'
  | 'trash'
  | 'application'

function formatClockTime(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}

function formatClockDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date)
}

function createProfileInitials(
  displayName: string,
): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0),
    )
    .join('')
    .toLocaleUpperCase('ru-RU')

  return initials || 'ВК'
}

function getDesktopIconKind(
  icon: SystemDesktopIcon,
): DesktopIconKind {
  if (
    icon.targetId === 'documents'
  ) {
    return 'documents'
  }

  if (
    icon.targetId === 'work'
  ) {
    return 'work'
  }

  if (
    icon.targetId === 'personal'
  ) {
    return 'personal'
  }

  if (
    icon.targetId === 'mail'
  ) {
    return 'mail'
  }

  if (
    icon.targetId === 'trash'
  ) {
    return 'trash'
  }

  return 'application'
}

function getIconMarkup(
  icon: SystemDesktopIcon,
): string {
  const iconKind =
    getDesktopIconKind(icon)

  if (iconKind === 'documents') {
    return `
      <svg
        class="
          system-icon
          system-icon--documents
        "
        viewBox="0 0 72 72"
        aria-hidden="true"
      >
        <ellipse
          class="icon-ground"
          cx="36"
          cy="61"
          rx="25"
          ry="5"
        ></ellipse>

        <path
          class="icon-folder-back"
          d="
            M9 20
            C9 17.8 10.8 16 13 16
            H29
            L35 22
            H59
            C61.2 22 63 23.8 63 26
            V52
            C63 54.2 61.2 56 59 56
            H13
            C10.8 56 9 54.2 9 52
            Z
          "
        ></path>

        <path
          class="icon-paper"
          d="
            M29 19
            H51
            C52.7 19 54 20.3 54 22
            V47
            H27
            V22
            C27 20.3 28.3 19 29 19
            Z
          "
        ></path>

        <path
          class="icon-paper-fold"
          d="
            M45 19
            L54 28
            H47
            C45.9 28 45 27.1 45 26
            Z
          "
        ></path>

        <path
          class="icon-paper-line"
          d="M32 31 H48"
        ></path>

        <path
          class="icon-paper-line"
          d="M32 36 H48"
        ></path>

        <path
          class="icon-paper-line"
          d="M32 41 H43"
        ></path>

        <path
          class="icon-folder-front"
          d="
            M8 29
            H31
            L35 33
            H64
            L60 56
            H13
            C10.2 56 8 53.8 8 51
            Z
          "
        ></path>

        <path
          class="icon-folder-shine"
          d="
            M12 32
            H31
            L35 36
            H59
          "
        ></path>
      </svg>
    `
  }

  if (iconKind === 'work') {
    return `
      <svg
        class="
          system-icon
          system-icon--work
        "
        viewBox="0 0 72 72"
        aria-hidden="true"
      >
        <ellipse
          class="icon-ground"
          cx="36"
          cy="61"
          rx="24"
          ry="5"
        ></ellipse>

        <path
          class="icon-handle-shadow"
          d="
            M26 24
            V19
            C26 16.8 27.8 15 30 15
            H42
            C44.2 15 46 16.8 46 19
            V24
          "
        ></path>

        <path
          class="icon-handle"
          d="
            M28 24
            V20
            C28 18.3 29.3 17 31 17
            H41
            C42.7 17 44 18.3 44 20
            V24
          "
        ></path>

        <rect
          class="icon-briefcase-body"
          x="9"
          y="23"
          width="54"
          height="34"
          rx="6"
        ></rect>

        <path
          class="icon-briefcase-top"
          d="
            M9 29
            C18 34 27 36 36 36
            C45 36 54 34 63 29
            V27
            C63 24.8 61.2 23 59 23
            H13
            C10.8 23 9 24.8 9 27
            Z
          "
        ></path>

        <path
          class="icon-briefcase-band"
          d="
            M9 36
            C18 40 27 42 36 42
            C45 42 54 40 63 36
          "
        ></path>

        <rect
          class="icon-briefcase-clasp"
          x="32"
          y="34"
          width="8"
          height="11"
          rx="2"
        ></rect>

        <path
          class="icon-briefcase-shine"
          d="M15 27 H55"
        ></path>
      </svg>
    `
  }

  if (iconKind === 'personal') {
    return `
      <svg
        class="
          system-icon
          system-icon--personal
        "
        viewBox="0 0 72 72"
        aria-hidden="true"
      >
        <ellipse
          class="icon-ground"
          cx="36"
          cy="61"
          rx="25"
          ry="5"
        ></ellipse>

        <path
          class="icon-folder-back"
          d="
            M9 20
            C9 17.8 10.8 16 13 16
            H29
            L35 22
            H59
            C61.2 22 63 23.8 63 26
            V53
            C63 55.2 61.2 57 59 57
            H13
            C10.8 57 9 55.2 9 53
            Z
          "
        ></path>

        <path
          class="icon-folder-front"
          d="
            M8 29
            H30
            L35 34
            H64
            L60 57
            H13
            C10.2 57 8 54.8 8 52
            Z
          "
        ></path>

        <circle
          class="icon-profile-disc"
          cx="40"
          cy="40"
          r="13"
        ></circle>

        <circle
          class="icon-profile-head"
          cx="40"
          cy="36"
          r="4.7"
        ></circle>

        <path
          class="icon-profile-body"
          d="
            M31.5 48
            C32.8 42.8 35.6 40.5 40 40.5
            C44.4 40.5 47.2 42.8 48.5 48
          "
        ></path>

        <path
          class="icon-folder-shine"
          d="
            M12 32
            H29
            L34 37
          "
        ></path>
      </svg>
    `
  }

  if (iconKind === 'mail') {
    return `
      <svg
        class="
          system-icon
          system-icon--mail
        "
        viewBox="0 0 72 72"
        aria-hidden="true"
      >
        <ellipse
          class="icon-ground"
          cx="36"
          cy="61"
          rx="25"
          ry="5"
        ></ellipse>

        <rect
          class="icon-mail-back"
          x="9"
          y="21"
          width="54"
          height="36"
          rx="7"
        ></rect>

        <path
          class="icon-mail-paper"
          d="
            M20 14
            H50
            C52.2 14 54 15.8 54 18
            V45
            H18
            V18
            C18 15.8 19.8 14 20 14
            Z
          "
        ></path>

        <path
          class="icon-mail-paper-line"
          d="M24 22 H47"
        ></path>

        <path
          class="icon-mail-paper-line"
          d="M24 28 H44"
        ></path>

        <path
          class="icon-mail-paper-line"
          d="M24 34 H48"
        ></path>

        <path
          class="icon-mail-front"
          d="
            M9 27
            L36 45
            L63 27
            V52
            C63 54.8 60.8 57 58 57
            H14
            C11.2 57 9 54.8 9 52
            Z
          "
        ></path>

        <path
          class="icon-mail-fold"
          d="
            M10 54
            L29 38
          "
        ></path>

        <path
          class="icon-mail-fold"
          d="
            M62 54
            L43 38
          "
        ></path>

        <path
          class="icon-mail-shine"
          d="
            M13 29
            L36 43
            L59 29
          "
        ></path>
      </svg>
    `
  }

  if (iconKind === 'trash') {
    return `
      <svg
        class="
          system-icon
          system-icon--trash
        "
        viewBox="0 0 72 72"
        aria-hidden="true"
      >
        <ellipse
          class="icon-ground"
          cx="36"
          cy="62"
          rx="20"
          ry="4.5"
        ></ellipse>

        <path
          class="icon-trash-paper"
          d="
            M24 15
            L31 11
            L38 21
            L30 25
            Z
          "
        ></path>

        <path
          class="icon-trash-paper-alt"
          d="
            M39 13
            L50 17
            L45 29
            L35 25
            Z
          "
        ></path>

        <path
          class="icon-trash-body"
          d="
            M19 25
            H53
            L49 57
            C48.7 59.3 46.8 61 44.5 61
            H27.5
            C25.2 61 23.3 59.3 23 57
            Z
          "
        ></path>

        <path
          class="icon-trash-panel"
          d="
            M25 30
            H47
            L44 55
            H28
            Z
          "
        ></path>

        <path
          class="icon-trash-line"
          d="M32 34 L33 52"
        ></path>

        <path
          class="icon-trash-line"
          d="M40 34 L39 52"
        ></path>

        <path
          class="icon-trash-lid"
          d="
            M17 21
            C17 19.3 18.3 18 20 18
            H52
            C53.7 18 55 19.3 55 21
            V25
            H17
            Z
          "
        ></path>

        <path
          class="icon-trash-handle"
          d="
            M29 18
            V15
            C29 13.3 30.3 12 32 12
            H40
            C41.7 12 43 13.3 43 15
            V18
          "
        ></path>
      </svg>
    `
  }

  return `
    <svg
      class="
        system-icon
        system-icon--application
      "
      viewBox="0 0 72 72"
      aria-hidden="true"
    >
      <ellipse
        class="icon-ground"
        cx="36"
        cy="61"
        rx="23"
        ry="5"
      ></ellipse>

      <rect
        class="icon-app-body"
        x="12"
        y="11"
        width="48"
        height="48"
        rx="13"
      ></rect>

      <rect
        class="icon-app-panel"
        x="19"
        y="18"
        width="34"
        height="34"
        rx="8"
      ></rect>

      <path
        class="icon-app-line"
        d="M26 28 H46"
      ></path>

      <path
        class="icon-app-line"
        d="M26 35 H46"
      ></path>

      <path
        class="icon-app-line"
        d="M26 42 H40"
      ></path>
    </svg>
  `
}

function renderDesktopIcon(
  icon: SystemDesktopIcon,
): string {
  return `
    <button
      class="desktop-icon"
      type="button"
      data-desktop-icon
      data-target-id="${escapeHtml(
        icon.targetId,
      )}"
      data-target-label="${escapeHtml(
        icon.label,
      )}"
      aria-label="Открыть ${escapeHtml(
        icon.label,
      )}"
      aria-pressed="false"
    >
      <span class="desktop-icon__image">
        ${getIconMarkup(icon)}
      </span>

      <span class="desktop-icon__label">
        ${escapeHtml(icon.label)}
      </span>
    </button>
  `
}

function renderMenuItem(
  icon: SystemDesktopIcon,
): string {
  return `
    <button
      class="system-menu__item"
      type="button"
      data-menu-open
      data-target-id="${escapeHtml(
        icon.targetId,
      )}"
      data-target-label="${escapeHtml(
        icon.label,
      )}"
    >
      <span
        class="system-menu__item-icon"
        aria-hidden="true"
      >
        ${getIconMarkup(icon)}
      </span>

      <span
        class="system-menu__item-content"
      >
        <strong>
          ${escapeHtml(icon.label)}
        </strong>

        <small>
          ${
            icon.targetId === 'mail'
              ? 'Сообщения и переписка'
              : icon.targetId === 'trash'
                ? 'Удалённые элементы'
                : 'Файлы и документы'
          }
        </small>
      </span>
    </button>
  `
}

function lockComputer(): void {
  try {
    window.sessionStorage.removeItem(
      LOGIN_STORAGE_KEY,
    )
  } catch {
    // Перезагрузка всё равно откроет экран входа.
  }

  const url =
    new URL(window.location.href)

  url.searchParams.delete('boot')
  url.searchParams.set('lock', '1')

  window.location.assign(
    `${url.pathname}${url.search}${url.hash}`,
  )
}

export function showDesktopScreen(
  root: HTMLDivElement,
  config: SystemConfig,
): void {
  const desktopIcons =
    config.desktop.icons

  const initials =
    createProfileInitials(
      config.profile.displayName,
    )

  const documentsIcon =
    desktopIcons.find(
      (icon) =>
        icon.targetId === 'documents',
    )

  const mailIcon =
    desktopIcons.find(
      (icon) =>
        icon.targetId === 'mail',
    )

  root.innerHTML = `
    <main
      class="desktop-shell"
      data-desktop-shell
    >
      <div
        class="desktop-wallpaper"
        aria-hidden="true"
      >
        <div
          class="
            desktop-wallpaper__glow
            desktop-wallpaper__glow--blue
          "
        ></div>

        <div
          class="
            desktop-wallpaper__glow
            desktop-wallpaper__glow--teal
          "
        ></div>

        <div
          class="
            desktop-wallpaper__glow
            desktop-wallpaper__glow--amber
          "
        ></div>

        <div
          class="
            desktop-wallpaper__panel
            desktop-wallpaper__panel--one
          "
        ></div>

        <div
          class="
            desktop-wallpaper__panel
            desktop-wallpaper__panel--two
          "
        ></div>

        <div
          class="
            desktop-wallpaper__lines
          "
        ></div>

        <div
          class="
            desktop-wallpaper__grain
          "
        ></div>

        <div
          class="
            desktop-wallpaper__vignette
          "
        ></div>
      </div>

      <header class="desktop-topbar">
        <div class="desktop-brand">
          <span
            class="desktop-brand__mark"
            aria-hidden="true"
          >
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>

          <div>
            <strong>
              Персональная система
            </strong>

            <span>
              Локальный рабочий стол
            </span>
          </div>
        </div>

        <div class="desktop-profile-chip">
          <div
            class="desktop-profile-chip__avatar"
            aria-hidden="true"
          >
            ${escapeHtml(initials)}
          </div>

          <div class="desktop-profile-chip__text">
            <strong>
              ${escapeHtml(
                config.profile.displayName,
              )}
            </strong>

            <span>
              <i aria-hidden="true"></i>
              Профиль активен
            </span>
          </div>
        </div>
      </header>

      <section
        class="desktop-workspace"
        aria-label="Рабочий стол"
      >
        <div class="desktop-icons">
          ${desktopIcons
            .map(renderDesktopIcon)
            .join('')}
        </div>
      </section>

      <aside
        class="system-menu"
        data-system-menu
        hidden
      >
        <header class="system-menu__header">
          <div class="system-menu__profile">
            <div
              class="system-menu__avatar"
              aria-hidden="true"
            >
              ${escapeHtml(initials)}
            </div>

            <div>
              <strong>
                ${escapeHtml(
                  config.profile.displayName,
                )}
              </strong>

              <span>
                Личный и рабочий профиль
              </span>
            </div>
          </div>

          <span class="system-menu__status">
            <i aria-hidden="true"></i>
            Активен
          </span>
        </header>

        <div class="system-menu__title">
          Быстрый доступ
        </div>

        <div class="system-menu__applications">
          ${desktopIcons
            .map(renderMenuItem)
            .join('')}
        </div>

        <footer class="system-menu__footer">
          <div>
            <strong>
              Персональный компьютер
            </strong>

            <span>
              Система работает локально
            </span>
          </div>

          <button
            class="system-menu__lock"
            type="button"
            data-lock-computer
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
              ></rect>

              <path
                d="
                  M8 10
                  V7.5
                  C8 5.6 9.6 4 12 4
                  C14.4 4 16 5.6 16 7.5
                  V10
                "
              ></path>
            </svg>

            Заблокировать
          </button>
        </footer>
      </aside>

      <div
        class="desktop-notice"
        role="status"
        aria-live="polite"
        data-desktop-notice
        hidden
      >
        <span
          class="desktop-notice__icon"
          aria-hidden="true"
        ></span>

        <span
          data-desktop-notice-text
        ></span>
      </div>

      <footer class="taskbar">
        <div class="taskbar__left">
          <button
            class="taskbar__system-button"
            type="button"
            aria-label="Главное меню"
            aria-expanded="false"
            data-system-menu-button
          >
            <span>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </span>
          </button>

          <div class="taskbar__divider"></div>

          ${
            documentsIcon
              ? `
                <button
                  class="taskbar__application"
                  type="button"
                  data-taskbar-open
                  data-target-id="documents"
                  data-target-label="Файловый менеджер"
                  aria-label="Файловый менеджер"
                  title="Файловый менеджер"
                >
                  <span
                    class="
                      taskbar__application-icon
                    "
                  >
                    ${getIconMarkup(
                      documentsIcon,
                    )}
                  </span>
                </button>
              `
              : ''
          }

          ${
            mailIcon
              ? `
                <button
                  class="taskbar__application"
                  type="button"
                  data-taskbar-open
                  data-target-id="mail"
                  data-target-label="Почта"
                  aria-label="Почта"
                  title="Почта"
                >
                  <span
                    class="
                      taskbar__application-icon
                    "
                  >
                    ${getIconMarkup(
                      mailIcon,
                    )}
                  </span>
                </button>
              `
              : ''
          }
        </div>

        <div class="taskbar__right">
          <div
            class="taskbar__tray"
            aria-label="Состояние системы"
          >
            <div
              class="taskbar__network"
              title="Сеть подключена"
            >
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div
              class="taskbar__volume"
              title="Звук"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="
                    M5 10
                    H9
                    L14 6
                    V18
                    L9 14
                    H5
                    Z
                  "
                ></path>

                <path
                  d="
                    M17 9
                    C18 10 18.5 11 18.5 12
                    C18.5 13 18 14 17 15
                  "
                ></path>
              </svg>
            </div>

            <div class="taskbar__clock">
              <strong
                data-desktop-time
              ></strong>

              <span
                data-desktop-date
              ></span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  `

  const iconButtons =
    Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        '[data-desktop-icon]',
      ),
    )

  const openButtons =
    Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        `
          [data-menu-open],
          [data-taskbar-open]
        `,
      ),
    )

  const menu =
    root.querySelector<HTMLElement>(
      '[data-system-menu]',
    )

  const menuButton =
    root.querySelector<HTMLButtonElement>(
      '[data-system-menu-button]',
    )

  const lockButton =
    root.querySelector<HTMLButtonElement>(
      '[data-lock-computer]',
    )

  const notice =
    root.querySelector<HTMLElement>(
      '[data-desktop-notice]',
    )

  const noticeText =
    root.querySelector<HTMLElement>(
      '[data-desktop-notice-text]',
    )

  const timeElement =
    root.querySelector<HTMLElement>(
      '[data-desktop-time]',
    )

  const dateElement =
    root.querySelector<HTMLElement>(
      '[data-desktop-date]',
    )

  if (
    !menu ||
    !menuButton ||
    !lockButton ||
    !notice ||
    !noticeText ||
    !timeElement ||
    !dateElement
  ) {
    throw new Error(
      'Не удалось создать рабочий стол.',
    )
  }

  const closeMenu = (): void => {
    menu.hidden = true

    menuButton.setAttribute(
      'aria-expanded',
      'false',
    )
  }

  const selectDesktopIcon = (
    selectedButton:
      HTMLButtonElement | null,
  ): void => {
    iconButtons.forEach((button) => {
      const isSelected =
        button === selectedButton

      button.classList.toggle(
        'desktop-icon--selected',
        isSelected,
      )

      button.setAttribute(
        'aria-pressed',
        String(isSelected),
      )
    })
  }

  const showTemporaryNotice = (
    label: string,
  ): void => {
    if (noticeTimerId !== null) {
      window.clearTimeout(
        noticeTimerId,
      )
    }

    noticeText.textContent =
      `Окно «${label}» будет подключено на следующем этапе.`

    notice.hidden = false

    noticeTimerId =
      window.setTimeout(
        () => {
          notice.hidden = true
          noticeTimerId = null
        },
        2800,
      )
  }

  const openTarget = (
    button: HTMLButtonElement,
  ): void => {
    const label =
      button.dataset.targetLabel ??
      'Приложение'

    showTemporaryNotice(label)
    closeMenu()
  }

  iconButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        selectDesktopIcon(button)
      },
    )

    button.addEventListener(
      'dblclick',
      () => {
        openTarget(button)
      },
    )

    button.addEventListener(
      'keydown',
      (event) => {
        if (
          event.key !== 'Enter' &&
          event.key !== ' '
        ) {
          return
        }

        event.preventDefault()
        openTarget(button)
      },
    )
  })

  openButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        openTarget(button)
      },
    )
  })

  menuButton.addEventListener(
    'click',
    () => {
      const willOpen =
        menu.hidden

      menu.hidden =
        !willOpen

      menuButton.setAttribute(
        'aria-expanded',
        String(willOpen),
      )
    },
  )

  lockButton.addEventListener(
    'click',
    lockComputer,
  )

  root.addEventListener(
    'click',
    (event) => {
      const target =
        event.target

      if (!(target instanceof Element)) {
        return
      }

      if (
        !target.closest(
          '[data-desktop-icon]',
        )
      ) {
        selectDesktopIcon(null)
      }

      if (
        menu.hidden ||
        target.closest(
          '[data-system-menu]',
        ) ||
        target.closest(
          '[data-system-menu-button]',
        )
      ) {
        return
      }

      closeMenu()
    },
  )

  root.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        closeMenu()
        selectDesktopIcon(null)
      }
    },
  )

  const updateClock = (): void => {
    const now = new Date()

    timeElement.textContent =
      formatClockTime(now)

    dateElement.textContent =
      formatClockDate(now)
  }

  updateClock()

  window.setInterval(
    updateClock,
    1000,
  )
}