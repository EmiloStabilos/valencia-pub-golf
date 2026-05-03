// Modern Valencia design — Arabic numerals everywhere.
// Names kept (toRoman, yearToRoman) so all call sites continue to compile.
export function toRoman(n: number): string {
  return String(n)
}

const DAYS_DA = ['SØNDAG', 'MANDAG', 'TIRSDAG', 'ONSDAG', 'TORSDAG', 'FREDAG', 'LØRDAG']
const MONTHS_DA = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC']

export function yearToRoman(year: number): string {
  return String(year)
}

export function formatDateHeader(d: Date = new Date()): { day: string; date: string } {
  const day = DAYS_DA[d.getDay()]
  const dd = String(d.getDate()).padStart(2, '0')
  const month = MONTHS_DA[d.getMonth()]
  const year = String(d.getFullYear())
  return { day, date: `${dd} · ${month} · ${year}` }
}
