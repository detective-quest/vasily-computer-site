import type {
  CaseCatalog,
  CaseManifest,
} from '../core/types/case'

let defaultCasePromise:
  | Promise<CaseManifest>
  | null = null

async function fetchJson<T>(
  path: string,
): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить ${path}. Код ответа: ${response.status}.`,
    )
  }

  return (await response.json()) as T
}

function validateCatalog(
  catalog: CaseCatalog,
): void {
  if (
    !catalog.defaultCaseId ||
    !Array.isArray(catalog.cases)
  ) {
    throw new Error(
      'Файл cases.json имеет неверную структуру.',
    )
  }
}

function validateManifest(
  manifest: CaseManifest,
): void {
  if (
    !manifest.id ||
    !manifest.driveLabel ||
    !Array.isArray(manifest.folders) ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error(
      'Файл manifest.json имеет неверную структуру.',
    )
  }
}

async function loadDefaultCaseFromFiles():
  Promise<CaseManifest> {
  const catalog =
    await fetchJson<CaseCatalog>(
      '/content/cases.json',
    )

  validateCatalog(catalog)

  const defaultCase =
    catalog.cases.find(
      (caseEntry) =>
        caseEntry.id ===
          catalog.defaultCaseId &&
        caseEntry.enabled,
    )

  if (!defaultCase) {
    throw new Error(
      'Расследование по умолчанию не найдено или отключено.',
    )
  }

  const manifest =
    await fetchJson<CaseManifest>(
      defaultCase.manifestPath,
    )

  validateManifest(manifest)

  return manifest
}

export function loadDefaultCase():
  Promise<CaseManifest> {
  if (!defaultCasePromise) {
    defaultCasePromise =
      loadDefaultCaseFromFiles().catch(
        (error: unknown) => {
          defaultCasePromise = null
          throw error
        },
      )
  }

  return defaultCasePromise
}