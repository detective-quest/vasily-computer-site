import type {
  MailAttachment,
  MailCatalog,
  MailMessage,
} from '../core/types/mail'

function getSelectedMessage(
  root: HTMLDivElement,
  catalog: MailCatalog,
): MailMessage | null {
  const selectedMessage =
    root.querySelector<HTMLElement>(
      '[data-mail-message-id].is-selected',
    )

  const messageId =
    selectedMessage?.dataset
      .mailMessageId

  if (!messageId) {
    return null
  }

  return (
    catalog.messages.find(
      (message) =>
        message.id === messageId,
    ) ??
    null
  )
}

function getAttachmentFromElement(
  root: HTMLDivElement,
  catalog: MailCatalog,
  attachmentElement: HTMLElement,
): MailAttachment | null {
  const selectedMessage =
    getSelectedMessage(
      root,
      catalog,
    )

  if (
    !selectedMessage ||
    !selectedMessage.attachments
  ) {
    return null
  }

  const reader =
    attachmentElement.closest<HTMLElement>(
      '[data-mail-reader]',
    )

  if (!reader) {
    return null
  }

  const attachmentElements =
    Array.from(
      reader.querySelectorAll<HTMLElement>(
        '.mail-attachment',
      ),
    )

  const attachmentIndex =
    attachmentElements.indexOf(
      attachmentElement,
    )

  if (attachmentIndex < 0) {
    return null
  }

  return (
    selectedMessage.attachments[
      attachmentIndex
    ] ??
    null
  )
}

function openFileThroughViewer(
  root: HTMLDivElement,
  attachment: MailAttachment,
): void {
  if (!attachment.fileId) {
    return
  }

  const temporaryFileElement =
    document.createElement('button')

  temporaryFileElement.type =
    'button'

  temporaryFileElement.hidden =
    true

  temporaryFileElement.dataset
    .fileManagerFile = ''

  temporaryFileElement.dataset
    .fileId =
      attachment.fileId

  temporaryFileElement.dataset
    .fileName =
      attachment.name

  root.append(
    temporaryFileElement,
  )

  temporaryFileElement.dispatchEvent(
    new MouseEvent(
      'dblclick',
      {
        bubbles: true,
        cancelable: true,
        view: window,
      },
    ),
  )

  temporaryFileElement.remove()
}

function enhanceAttachments(
  root: HTMLDivElement,
  catalog: MailCatalog,
): void {
  const attachmentElements =
    root.querySelectorAll<HTMLElement>(
      '.mail-attachment',
    )

  attachmentElements.forEach(
    (attachmentElement) => {
      const attachment =
        getAttachmentFromElement(
          root,
          catalog,
          attachmentElement,
        )

      const isAvailable =
        Boolean(
          attachment?.fileId,
        )

      attachmentElement.dataset
        .mailAttachmentState =
          isAvailable
            ? 'ready'
            : 'unavailable'

      if (isAvailable) {
        attachmentElement.setAttribute(
          'role',
          'button',
        )

        attachmentElement.setAttribute(
          'tabindex',
          '0',
        )

        attachmentElement.setAttribute(
          'title',
          `Открыть ${attachment?.name ?? 'вложение'}`,
        )

        attachmentElement.setAttribute(
          'aria-label',
          `Открыть вложение ${attachment?.name ?? ''}`,
        )

        return
      }

      attachmentElement.setAttribute(
        'role',
        'group',
      )

      attachmentElement.removeAttribute(
        'tabindex',
      )

      attachmentElement.removeAttribute(
        'title',
      )
    },
  )
}

export function attachMailAttachmentBridge(
  root: HTMLDivElement,
  catalog: MailCatalog,
): void {
  let enhancementScheduled =
    false

  const scheduleEnhancement =
    (): void => {
      if (enhancementScheduled) {
        return
      }

      enhancementScheduled =
        true

      window.requestAnimationFrame(
        () => {
          enhancementScheduled =
            false

          enhanceAttachments(
            root,
            catalog,
          )
        },
      )
    }

  const observer =
    new MutationObserver(
      scheduleEnhancement,
    )

  observer.observe(
    root,
    {
      childList: true,
      subtree: true,
    },
  )

  scheduleEnhancement()

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

      const attachmentElement =
        target.closest<HTMLElement>(
          '.mail-attachment[data-mail-attachment-state="ready"]',
        )

      if (!attachmentElement) {
        return
      }

      const attachment =
        getAttachmentFromElement(
          root,
          catalog,
          attachmentElement,
        )

      if (!attachment?.fileId) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openFileThroughViewer(
        root,
        attachment,
      )
    },
    true,
  )

  root.addEventListener(
    'keydown',
    (event) => {
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

      const attachmentElement =
        target.closest<HTMLElement>(
          '.mail-attachment[data-mail-attachment-state="ready"]',
        )

      if (!attachmentElement) {
        return
      }

      const attachment =
        getAttachmentFromElement(
          root,
          catalog,
          attachmentElement,
        )

      if (!attachment?.fileId) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openFileThroughViewer(
        root,
        attachment,
      )
    },
    true,
  )
}