const LETTER = 'a-zA-ZáéíóúÁÉÍÓÚüÜñÑ'

export const onlyDigits = (value: string) => value.replace(/\D/g, '')

/** Letras, espacios, guion y apóstrofo (p. ej. "Pérez-Gómez", "O'Neil"). */
export const onlyNameChars = (value: string) =>
  value.replace(new RegExp(`[^${LETTER}' -]`, 'g'), '')

/** Quita espacios al inicio/fin y colapsa los repetidos. */
export const normalizeSpaces = (value: string) =>
  value.trim().replace(/\s+/g, ' ')

export const isValidAccount = (value: string) => /^\d{5,12}$/.test(value)

export const isValidName = (value: string) =>
  new RegExp(`^[${LETTER}]+(?:[ '-][${LETTER}]+)*$`).test(
    normalizeSpaces(value),
  )

export const EVENTO_NOMBRE_MAX = 80

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: string) => UUID_RE.test(value)
