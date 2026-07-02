// 運筆終端判定の救済（Issue #12: タッチパッド離し際のフリック誤判定対策）に
// 使う閾値。距離は hanzi-writer 内部座標（1辺 1024）基準。
export const LIFT_FLICK = {
  // これ以上のサンプル間隔をポーズ（とめ）とみなす。
  // kakitori 内部の tome 判定閾値（80ms）に合わせる。
  PAUSE_MS: 80,
  // ポーズ後に発生した移動をノイズとみなす最大経路長
  PAUSED_MAX_DIST: 50,
  // ポーズがなくてもノイズとみなす微小フリックの最大経路長・持続時間
  TINY_MAX_DIST: 20,
  TINY_MAX_MS: 80,
} as const
