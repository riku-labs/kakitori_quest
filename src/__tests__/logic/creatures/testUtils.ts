// clipPath id は生成ごとに変わるため、決定性比較の前に正規化する
export function normalizeIds(svg: string): string {
  return svg.replace(/id="[^"]+"/g, 'id="X"').replace(/url\(#[^)]+\)/g, 'url(#X)')
}
