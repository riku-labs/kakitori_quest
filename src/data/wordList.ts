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
];
