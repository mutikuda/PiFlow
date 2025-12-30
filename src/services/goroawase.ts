/**
 * 円周率の語呂合わせデータ
 *
 * 語呂合わせは記憶の補助として使用され、
 * 現在の入力位置に応じて適切な語呂合わせを表示します。
 */

export interface GoroawaseData {
  start: number;
  end: number;
  text: string;
}

/**
 * 語呂合わせデータ（厳選・修正版 200桁）
 */
export const GOROAWASE_DATA: GoroawaseData[] = [
  { start: 2, end: 12, text: "産医師、異国に向こう (さんいしいこくにむこう)" },
  { start: 12, end: 22, text: "薬なく、産婦宮代に (やくな(く)さんぷみやしろに)" },
  { start: 22, end: 32, text: "虫散々、闇に鳴く (むしさんざんやミニなく)" },
  { start: 32, end: 42, text: "御礼には、早行かない (ごれいにははよ(う)いかない)" },
  { start: 42, end: 52, text: "無草、菊見に婿入れ (むくさ、きくみにむこいれ)" },
  { start: 52, end: 62, text: "小屋におくなよ、急死 (こやにおくなよきゅうし)" },
  { start: 62, end: 72, text: "号泣兄さん、女は色よ (ごうきゅうにいさん、おなはいろよ)" },
  { start: 72, end: 82, text: "オムツは無二、親クック (おむつはむに、おやくっく)" },
  { start: 82, end: 92, text: "ハロー庭、お刺身屋にGO (はろーにわ、おさしみやにご)" },
  { start: 92, end: 102, text: "三好いいな、オーム鳴く (みよいいなおーむなく)" },
  { start: 102, end: 112, text: "ハニー医師、晴れハロ恋 (はにーいし、はれはろこい)" },
  { start: 112, end: 122, text: "ミニハニー見ろ、ムム死な (みにはにーみろ、むむしな)" },
  { start: 122, end: 132, text: "奥さん早よ、シロ救護 (おくさんはよ、しろきゅうご)" },
  { start: 132, end: 142, text: "GO！GO！ハニー、兄さんいいな (ごーごーはにー、にいさんいいな)" },
  { start: 142, end: 152, text: "ゴミコク、塩ハイ庭 (ごみこく、しおはいにわ)" },
  { start: 152, end: 162, text: "司祭いいな、仕事オーツ (しさいいいな、しごとおーつ)" },
  { start: 162, end: 172, text: "箸入れ船入れ、一休さん (はしいれふないれ、いっきゅうさん)" },
  { start: 172, end: 182, text: "箱にいい男、午後ック (はこにいいおとこ、ごごっく)" },
  { start: 182, end: 192, text: "虫四郎、夫婦串焼く (むししろう、ふうふくしやく)" },
  { start: 192, end: 202, text: "腰組王様、俳句色 (こしぐみおうさま、はいくいろ)" },
];

/**
 * 現在の位置に対応する語呂合わせを取得
 * @param position 現在の桁数（0から始まる）
 * @returns 語呂合わせテキスト、または空文字列
 */
export function getCurrentGoroawase(position: number): string {
  const match = GOROAWASE_DATA.find(
    (data) => position >= data.start && position < data.end
  );

  if (match) {
    return match.text;
  }

  // 200桁を超えた場合
  if (position >= 202) {
    return "ここからは自分との戦いです！";
  }

  return "";
}
