export const LICENCIATURAS = [
  'Licenciatura en Seguridad Ciudadana',
  'Licenciatura de Ingeniería en Computación',
  'Licenciatura de Ingeniería Mecánica',
  'Licenciatura de Ingeniería en Plásticos',
  'Licenciatura de Ingeniería en Producción Industrial',
  'Licenciatura de Ingeniería en Software',
  'Licenciatura en Ingeniería en Ciberseguridad',
] as const

export type Licenciatura = (typeof LICENCIATURAS)[number]

export const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
