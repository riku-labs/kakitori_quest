// クリーチャー v2 共通パレット。hue は漢字DNA由来
export interface CreaturePalette {
  main: string
  belly: string
  dark: string
  outline: string
  accent: string
}

export function creatureColors(hue: number): CreaturePalette {
  return {
    main: `hsl(${hue},68%,55%)`,
    belly: `hsl(${hue},60%,76%)`,
    dark: `hsl(${hue},60%,36%)`,
    outline: `hsl(${hue},55%,15%)`,
    accent: `hsl(${(hue + 180) % 360},75%,60%)`,
  }
}
