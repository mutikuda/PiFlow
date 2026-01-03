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
  { start: 0, end: 10, text: "産医師、異国に向こう (さんいしいこくにむこう)" },
  { start: 10, end: 20, text: "薬なく、産婦宮代に (やくな(く)さんぷみやしろに)" },
  { start: 20, end: 30, text: "虫散々、闇に鳴く (むしさんざんやミニなく)" },
  { start: 30, end: 40, text: "御礼には、早行かない (ごれいにははよ(う)いかない)" },
  { start: 40, end: 50, text: "無草、菊見に婿入れ (むくさ、きくみにむこいれ)" },
  { start: 50, end: 60, text: "小屋におくなよ、急死 (こやにおくなよきゅうし)" },
  { start: 60, end: 70, text: "号泣兄さん、女は色よ (ごうきゅうにいさん、おなはいろよ)" },
  { start: 70, end: 80, text: "オムツは無二、親クック (おむつはむに、おやくっく)" },
  { start: 80, end: 90, text: "ハムには大さじバニー粉 (はむにはおおさじばにーこ)" },
  { start: 90, end: 100, text: "三好いいな、オーム鳴く (みよいいなおーむなく)" },
  { start: 100, end: 110, text: "ハニー医師、晴れハロ恋 (はにーいし、はれはろこい)" },
  { start: 110, end: 120, text: "ミニハニー見ろ、ムム死な (みにはにーみろ、むむしな)" },
  { start: 120, end: 130, text: "奥さん早よ、シロ救護 (おくさんはよ、しろきゅうご)" },
  { start: 130, end: 140, text: "GO！GO！ハニー、兄さんいいな (ごーごーはにー、にいさんいいな)" },
  { start: 140, end: 150, text: "ゴミコク、塩ハイ庭 (ごみこく、しおはいにわ)" },
  { start: 150, end: 160, text: "司祭いいな、仕事オーツ (しさいいいな、しごとおーつ)" },
  { start: 160, end: 170, text: "箸入れ船入れ、一休さん (はしいれふないれ、いっきゅうさん)" },
  { start: 170, end: 180, text: "箱にいい男、午後ック (はこにいいおとこ、ごごっく)" },
  { start: 180, end: 190, text: "虫四郎、夫婦串焼く (むししろう、ふうふくしやく)" },
  { start: 190, end: 200, text: "腰組王様、俳句色 (こしぐみおうさま、はいくいろ)" },
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
  if (position >= 200) {
    return "ここからは自分との戦いです！";
  }

  return "";
}
