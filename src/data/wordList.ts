export interface WordEntry {
	word: string; // ひらがな
	reading: string; // 同じ（将来漢字が入るときに分離）
	hint: string; // 画面表示用の意味ヒント（例: "🐕"）
}

export const WORD_LIST: WordEntry[] = [
	// 1文字
	{ word: "え", reading: "え", hint: "🖼️" },
	{ word: "か", reading: "か", hint: "🦟" },
	{ word: "き", reading: "き", hint: "🌳" },
	{ word: "こ", reading: "こ", hint: "🧒" },
	{ word: "て", reading: "て", hint: "🖐️" },
	{ word: "ひ", reading: "ひ", hint: "🔥" },
	{ word: "め", reading: "め", hint: "👁️" },
	{ word: "や", reading: "や", hint: "🏹" },
	{ word: "ゆ", reading: "ゆ", hint: "♨️" },
	{ word: "わ", reading: "わ", hint: "⭕" },
	// 2文字
	{ word: "あめ", reading: "あめ", hint: "🌧️" },
	{ word: "いぬ", reading: "いぬ", hint: "🐕" },
	{ word: "うし", reading: "うし", hint: "🐄" },
	{ word: "えび", reading: "えび", hint: "🦐" },
	{ word: "かに", reading: "かに", hint: "🦀" },
	{ word: "くも", reading: "くも", hint: "☁️" },
	{ word: "さる", reading: "さる", hint: "🐒" },
	{ word: "たこ", reading: "たこ", hint: "🐙" },
	{ word: "ねこ", reading: "ねこ", hint: "🐈" },
	{ word: "はな", reading: "はな", hint: "🌸" },
	// 3文字
	{ word: "いちご", reading: "いちご", hint: "🍓" },
	{ word: "うさぎ", reading: "うさぎ", hint: "🐰" },
	{ word: "きつね", reading: "きつね", hint: "🦊" },
	{ word: "さくら", reading: "さくら", hint: "🌸" },
	{ word: "りんご", reading: "りんご", hint: "🍎" },
	// 4文字
	{ word: "あおぞら", reading: "あおぞら", hint: "🌤️" },
	{ word: "ひまわり", reading: "ひまわり", hint: "🌻" },
	{ word: "むらさき", reading: "むらさき", hint: "💜" },
	// 5文字
	{ word: "かたつむり", reading: "かたつむり", hint: "🐌" },
	// 漢字1文字（小学1年生）
	{ word: "山", reading: "やま", hint: "⛰️" },
	{ word: "川", reading: "かわ", hint: "🏞️" },
	{ word: "木", reading: "き", hint: "🌲" },
	{ word: "火", reading: "ひ", hint: "🔥" },
	{ word: "水", reading: "みず", hint: "💧" },
	{ word: "日", reading: "ひ", hint: "☀️" },
	{ word: "月", reading: "つき", hint: "🌙" },
	{ word: "目", reading: "め", hint: "👁️" },
	{ word: "耳", reading: "みみ", hint: "👂" },
	{ word: "口", reading: "くち", hint: "👄" },
	{ word: "手", reading: "て", hint: "🖐️" },
	{ word: "花", reading: "はな", hint: "🌸" },
	{ word: "虫", reading: "むし", hint: "🐛" },
	{ word: "雨", reading: "あめ", hint: "🌧️" },
	{ word: "石", reading: "いし", hint: "🪨" },
	{ word: "草", reading: "くさ", hint: "🌿" },
	{ word: "竹", reading: "たけ", hint: "🎋" },
	{ word: "森", reading: "もり", hint: "🌳" },
	{ word: "空", reading: "そら", hint: "🌤️" },
	{ word: "犬", reading: "いぬ", hint: "🐕" },
	// 漢字2文字（小学1年生）
	{ word: "火山", reading: "かざん", hint: "🌋" },
	{ word: "大木", reading: "たいぼく", hint: "🌳" },
	{ word: "天気", reading: "てんき", hint: "⛅" },
	{ word: "草木", reading: "くさき", hint: "🌿" },
	{ word: "大空", reading: "おおぞら", hint: "🌌" },
];
