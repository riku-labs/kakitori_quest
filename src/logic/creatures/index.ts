import type { KanjiDNA, CreatureSpec } from '../../types/game'
import { generateBiped } from './biped'
import { generateSlime } from './slime'
import { generateEyeTentacle } from './eyeTentacle'
import { generateBeast } from './beast'
import { generateOrb } from './orb'

// 種族順は旧実装と同一（0:Biped 1:Slime 2:EyeTentacle 3:Beast 4:Orb）
const GENERATORS: ((dna: KanjiDNA) => string)[] = [
  generateBiped,
  generateSlime,
  generateEyeTentacle,
  generateBeast,
  generateOrb,
]

export function selectSpecies(dna: KanjiDNA, word: string): number {
  const wordHash = word.split('').reduce((s, c) => s + (c.codePointAt(0) ?? 0), 0)
  return (dna.strokeCount + Math.round(dna.hRatio * 10) + wordHash) % 5
}

const SPECIES_NAME_FN: ((word: string) => string)[] = [
  (word) => `「${word}」マン`,
  (word) => `「${word}」ののろい`,
  (word) => `「${word}」アイ`,
  (word) => `「${word}」のけもの`,
  (word) => `そらとぶ「${word}」`,
]

export function generateCreatureName(species: number, word: string): string {
  return SPECIES_NAME_FN[species](word)
}

export function generateCreature(dna: KanjiDNA, word: string): CreatureSpec {
  const species = selectSpecies(dna, word)
  const svgString = GENERATORS[species](dna)
  const name = generateCreatureName(species, word)
  return { species, dna, svgString, name }
}
