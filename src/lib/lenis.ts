import type Lenis from 'lenis'

let instance: Lenis | null = null

export const setLenisInstance = (lenis: Lenis | null): void => {
  instance = lenis
}

export const getLenisInstance = (): Lenis | null => instance
