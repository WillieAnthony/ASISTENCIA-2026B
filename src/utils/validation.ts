export const onlyDigits = (value: string) => value.replace(/\D/g, '')

export const onlyLetters = (value: string) =>
  value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')

export const isValidAccount = (value: string) => /^\d{5,12}$/.test(value)

export const isValidName = (value: string) =>
  /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+)*$/.test(
    value.trim(),
  )
