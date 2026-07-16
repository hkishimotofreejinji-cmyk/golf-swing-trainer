import { getGeminiApiKey } from '../../db'
import { getClubLabel } from '../clubs/clubs'
import type { CoachingFeedback, SwingSession } from '../../types'
import type { CoachingProfile } from './profile'
import { getTagLabel } from '../knowledge/constants'

// Free-tier eligible at time of writing. If this model name 404s, check
// https://ai.google.dev/gemini-api/docs/models for the current "flash" model.
const MODEL = 'gemini-2.0-flash'

// What a low score means for each metric key, so the model can interpret raw
// numbers correctly without guessing at our internal scoring conventions.
const METRIC_GLOSSARY: Record<string, string> = {
  sway: 'バックスイングで腰が右に流れる(スウェー)度合い。低いほどスウェーが大きい。',
  right_elbow: 'トップで右肘が体から離れる(フライングエルボー)度合い。低いほど右脇が開いている。',
  x_factor: '肩の回転に対する腰の回転の抑え具合(捻転差=Xファクター)。低いほど手打ちで捻転差が小さい。',
  transition_pause: 'トップでの「間(タメ)」の有無。低いほど切り返しが急いでいる。',
  early_extension: 'アドレスからインパクトにかけての前傾角度の変化。低いほど起き上がっている(アーリーエクステンション)。',
  head_impact: 'アドレスからインパクトにかけての頭の上下動。低いほど頭が大きく動いている。',
  early_opening: 'インパクト時点で体(肩)が開いている度合い。低いほど早く開いている。',
  heel_lift: 'インパクト直後の右かかとの浮き上がり方。低いほど早く浮いている。',
  chicken_wing: 'フォロースルーでの左肘の伸び。低いほど左肘が曲がっている(チキンウィング)。',
  finish_balance: 'フィニッシュでの重心の収まり方。低いほどバランスが悪い。',
  swing_plane: '(参考値・精度低め)バックスイングのプレーンの角度。',
  top_elbow: '(参考値・精度低め)トップでの右肘の向き。低いほど肘が浮いている。',
  lower_body_lead: '(参考値・精度低め)切り返しでの下半身リードの度合い。低いほど上半身主導。',
  early_release: '(参考値・精度低め)ダウンスイングでの手首の解け(リリース)の早さ。低いほど早い(アーリーリリース)。',
  hand_path: '(参考値・精度低め)手元の軌道のインサイド/アウトサイドのズレ。',
}

const SYSTEM_PROMPT = `あなたは経験豊富で温かいゴルフコーチです。生徒のスイング解析データを見て、フィードバックを作成します。

# 出力ルール(必ず守ること)
1. 絶対に抽象的なアドバイスで終わらせない。「頭を安定させましょう」のような一般論は禁止。「なぜそのエラーが出ているのか(原因)」と「具体的にどう体を動かすべきか(対策)」を必ずセットで説明する。
2. 各改善点は「大項目(どのフェーズか)」「中項目(どこの動きか)」「小項目(具体的なエラー内容)」の3段構造で提示する。
3. 改善点は最大3つまで。20項目すべてを指摘せず、優先度が高い(他のエラーの根本原因になっている、または生徒の慢性的な課題と一致する)ものから選ぶ。スコアが低い項目同士の因果関係(例: スウェー→起き上がり→頭の上下動、右脇が開く→捻転差が小さい→手打ち、など)を考慮し、根本原因を優先する。
4. 次の練習ですぐできる具体的なドリルを1つ提案する。クラブを持たない自宅ドリルやハーフスイングでの確認方法など、体感できるものにする。
5. 対話的で親しみやすく、共感性のあるトーン。専門用語を並べるのではなく、生徒の課題に共感しながらステップバイステップで成長をサポートする「先生」の口調で語りかける。

生徒の目標や慢性的な傾向(過去の課題)が伝えられるので、今回のスイングのスコアと照らし合わせて、慢性的な傾向に関係する項目を優先的に取り上げること。ただし今回のデータに現れていない問題を創作してはいけない。

出力は指定されたJSONスキーマの構造に厳密に従って返すこと。`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    overallSummary: {
      type: 'string',
      description: '本日の総評とスイングの繋がり。全体的な傾向、良い点、今回最もエラーを引き起こしている根本原因を簡潔に。',
    },
    priorities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          majorCategory: { type: 'string', description: '大項目。どのフェーズか(例: Ⅲ. ダウンスイング・インパクト)' },
          midCategory: { type: 'string', description: '中項目。どこの動きか(例: 前傾軸(背骨の角度))' },
          minorCategory: { type: 'string', description: '小項目。具体的なエラー内容' },
          symptom: { type: 'string', description: '起きている現象' },
          cause: { type: 'string', description: 'なぜ起こるのか(原因)' },
          fix: { type: 'string', description: 'どう改善するか(具体的な体の動かし方)' },
        },
        required: ['majorCategory', 'midCategory', 'minorCategory', 'symptom', 'cause', 'fix'],
      },
    },
    drill: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ドリルの名前' },
        steps: { type: 'array', items: { type: 'string' }, description: '手順' },
        effect: { type: 'string', description: 'このドリルでスイングがどう変わるか' },
      },
      required: ['name', 'steps', 'effect'],
    },
  },
  required: ['overallSummary', 'priorities', 'drill'],
}

function buildUserContent(session: SwingSession, profile: CoachingProfile): string {
  const metricLines = session.metrics
    .map((m) => `- [${m.tier === 'reference' ? '参考値' : '主要'}] ${m.label}(${m.key}): ${m.score}点 / ${m.detail} / 意味: ${METRIC_GLOSSARY[m.key] ?? ''}`)
    .join('\n')

  const tendencyLabels = profile.tendencies.map(getTagLabel).join('、')
  const selfCheckLabels = (session.selfChecks ?? []).map(getTagLabel).join('、') || 'なし'

  return `# 生徒のプロフィール
目標: ${profile.goal}
慢性的な傾向・過去の課題: ${tendencyLabels}
理想とする動き: ${profile.idealMovementNotes}

# 今回のスイング
使用クラブ: ${getClubLabel(session.club)}
総合スコア: ${session.overallScore}点
今回気になっている点(自由記述): ${session.focusNote ?? 'なし'}
今回のショットで自己申告された項目: ${selfCheckLabels}

# 項目別スコア(主要10項目 + 参考値5項目)
${metricLines}

上記データをもとに、出力ルールに従ってフィードバックを作成してください。`
}

export async function generateCoachingFeedback(
  session: SwingSession,
  profile: CoachingProfile,
): Promise<CoachingFeedback> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('設定画面でGemini APIキーを登録してください')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildUserContent(session, profile) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    let message = text.slice(0, 300)
    try {
      message = JSON.parse(text).error?.message ?? message
    } catch {
      // not JSON, fall back to raw text above
    }
    throw new Error(`AIコーチの呼び出しに失敗しました (status ${res.status}): ${message}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('AIコーチの応答を解析できませんでした')

  const parsed = JSON.parse(text)
  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  }
}
