// 間違い画ハイライト表示（MistakeStrokesDisplay）の描画定数
export const MISTAKE_DISPLAY = {
  size: 96,
  mistakeColor: '#ff5555',
  // ライブラリの非同期描画完了を待つポーリング設定
  pollIntervalMs: 100,
  pollTimeoutMs: 5000,
} as const
