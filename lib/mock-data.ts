export interface Company {
  id: number;
  name: string;
  sector: string;
  prefecture: string;
  score: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  value: string;
  signals: string[];
  revenue: number[];
  phone: string;
  email: string;
  web: string;
}

export const companies: Company[] = [
  { id: 1, name: "有限会社田中建設", sector: "建設", prefecture: "愛知", score: 92, urgency: "CRITICAL", value: "¥8.2億", signals: ["TAX_DELINQUENT", "CEO_CHANGE"], revenue: [280,310,295,240,180], phone: "052-XXX-XXXX", email: "info@tanaka-const.jp", web: "tanaka-const.jp" },
  { id: 2, name: "株式会社山田製造", sector: "製造", prefecture: "大阪", score: 87, urgency: "HIGH", value: "¥12.5億", signals: ["HIRING_FREEZE", "REVENUE_DECLINE"], revenue: [450,420,380,350,310], phone: "06-XXX-XXXX", email: "info@yamada-mfg.jp", web: "yamada-mfg.jp" },
  { id: 3, name: "佐藤商事株式会社", sector: "商社", prefecture: "東京", score: 78, urgency: "HIGH", value: "¥5.1億", signals: ["NEGATIVE_SENTIMENT", "POST_FREQ_DROP"], revenue: [890,920,870,790,720], phone: "03-XXX-XXXX", email: "info@sato-trading.jp", web: "sato-trading.jp" },
  { id: 4, name: "有限会社鈴木食品", sector: "食品", prefecture: "北海道", score: 71, urgency: "MEDIUM", value: "¥3.8億", signals: ["PATENT_LAPSED", "DOMAIN_EXPIRING"], revenue: [120,135,128,115,95], phone: "011-XXX-XXXX", email: "info@suzuki-food.jp", web: "suzuki-food.jp" },
  { id: 5, name: "渡辺電機株式会社", sector: "電機", prefecture: "神奈川", score: 85, urgency: "HIGH", value: "¥22.0億", signals: ["MASS_RESIGNATION", "BANKRUPTCY_ADJACENT"], revenue: [1200,1150,1050,920,780], phone: "045-XXX-XXXX", email: "info@watanabe-elec.jp", web: "watanabe-elec.jp" },
  { id: 6, name: "中村運輸有限会社", sector: "物流", prefecture: "福岡", score: 65, urgency: "MEDIUM", value: "¥2.1億", signals: ["LISTED_ON_BATONZ"], revenue: [85,90,82,75,68], phone: "092-XXX-XXXX", email: "info@nakamura-trans.jp", web: "nakamura-trans.jp" },
  { id: 7, name: "小林印刷株式会社", sector: "印刷", prefecture: "京都", score: 88, urgency: "CRITICAL", value: "¥6.5億", signals: ["OFFICE_CLOSURE", "CEO_CHANGE"], revenue: [340,360,330,290,240], phone: "075-XXX-XXXX", email: "info@kobayashi-print.jp", web: "kobayashi-print.jp" },
  { id: 8, name: "伊藤金属工業", sector: "金属", prefecture: "愛知", score: 74, urgency: "MEDIUM", value: "¥9.3億", signals: ["TAX_DELINQUENT"], revenue: [560,580,550,500,430], phone: "052-XXX-XXXX", email: "info@ito-metal.jp", web: "ito-metal.jp" },
  { id: 9, name: "加藤農業株式会社", sector: "農業", prefecture: "青森", score: 55, urgency: "LOW", value: "¥1.2億", signals: ["POST_FREQ_DROP"], revenue: [45,48,44,40,35], phone: "017-XXX-XXXX", email: "info@kato-agri.jp", web: "kato-agri.jp" },
  { id: 10, name: "吉田医療機器", sector: "医療", prefecture: "大阪", score: 82, urgency: "HIGH", value: "¥18.7億", signals: ["PATENT_LAPSED", "CEO_CHANGE"], revenue: [820,850,800,740,680], phone: "06-XXX-XXXX", email: "info@yoshida-med.jp", web: "yoshida-med.jp" },
  { id: 11, name: "松本観光有限会社", sector: "観光", prefecture: "沖縄", score: 68, urgency: "MEDIUM", value: "¥4.4億", signals: ["REVENUE_DECLINE", "NEGATIVE_SENTIMENT"], revenue: [180,200,160,120,90], phone: "098-XXX-XXXX", email: "info@matsumoto-tour.jp", web: "matsumoto-tour.jp" },
  { id: 12, name: "井上ソフトウェア", sector: "IT", prefecture: "東京", score: 76, urgency: "MEDIUM", value: "¥7.8億", signals: ["HIRING_FREEZE", "MASS_RESIGNATION"], revenue: [420,480,450,400,360], phone: "03-XXX-XXXX", email: "info@inoue-soft.jp", web: "inoue-soft.jp" },
  { id: 13, name: "木村繊維株式会社", sector: "繊維", prefecture: "静岡", score: 62, urgency: "LOW", value: "¥2.9億", signals: ["DOMAIN_EXPIRING"], revenue: [130,125,115,100,88], phone: "054-XXX-XXXX", email: "info@kimura-textile.jp", web: "kimura-textile.jp" },
  { id: 14, name: "林建設工業株式会社", sector: "建設", prefecture: "埼玉", score: 89, urgency: "CRITICAL", value: "¥15.6億", signals: ["BANKRUPTCY_ADJACENT", "TAX_DELINQUENT"], revenue: [680,720,690,620,530], phone: "048-XXX-XXXX", email: "info@hayashi-const.jp", web: "hayashi-const.jp" },
  { id: 15, name: "清水化学工業", sector: "化学", prefecture: "千葉", score: 79, urgency: "HIGH", value: "¥11.2億", signals: ["OFFICE_CLOSURE", "REVENUE_DECLINE"], revenue: [590,620,580,520,460], phone: "043-XXX-XXXX", email: "info@shimizu-chem.jp", web: "shimizu-chem.jp" },
];

export const signalTypes = [
  "TAX_DELINQUENT", "CEO_CHANGE", "HIRING_FREEZE", "PATENT_LAPSED",
  "DOMAIN_EXPIRING", "NEGATIVE_SENTIMENT", "MASS_RESIGNATION", "BANKRUPTCY_ADJACENT",
  "REVENUE_DECLINE", "LISTED_ON_BATONZ", "OFFICE_CLOSURE", "POST_FREQ_DROP"
] as const;

export const signalLabels: Record<string, string> = {
  TAX_DELINQUENT: "税金滞納",
  CEO_CHANGE: "代表変更",
  HIRING_FREEZE: "採用凍結",
  PATENT_LAPSED: "特許失効",
  DOMAIN_EXPIRING: "ドメイン期限",
  NEGATIVE_SENTIMENT: "ネガティブ評判",
  MASS_RESIGNATION: "大量退職",
  BANKRUPTCY_ADJACENT: "倒産隣接",
  REVENUE_DECLINE: "売上減少",
  LISTED_ON_BATONZ: "バトンズ掲載",
  OFFICE_CLOSURE: "事務所閉鎖",
  POST_FREQ_DROP: "投稿頻度低下",
};

export const signalColors: Record<string, string> = {
  TAX_DELINQUENT: "#FF3B3B",
  CEO_CHANGE: "#FFB800",
  HIRING_FREEZE: "#FF6B35",
  PATENT_LAPSED: "#8B5CF6",
  DOMAIN_EXPIRING: "#00B8D9",
  NEGATIVE_SENTIMENT: "#FF3B3B",
  MASS_RESIGNATION: "#FF3B3B",
  BANKRUPTCY_ADJACENT: "#FF0000",
  REVENUE_DECLINE: "#FFB800",
  LISTED_ON_BATONZ: "#00FF88",
  OFFICE_CLOSURE: "#FF6B35",
  POST_FREQ_DROP: "#8896B3",
};

export const urgencyColors: Record<string, string> = {
  CRITICAL: "#FF3B3B",
  HIGH: "#FFB800",
  MEDIUM: "#00B8D9",
  LOW: "#8896B3",
};

export function getRandomSignal() {
  const company = companies[Math.floor(Math.random() * companies.length)];
  const signal = signalTypes[Math.floor(Math.random() * signalTypes.length)];
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return {
    id: Date.now() + Math.random(),
    timestamp: `${h}:${m}:${s}`,
    company: company.name,
    signal,
    severity: Math.floor(Math.random() * 5) + 1,
  };
}

export const ideas = [
  { id: 1, title: "愛知県建設業M&Aレポート", body: "愛知県内の建設業に特化した売却予測レポートを月次で自動生成する", priority: "HIGH", tags: ["M&A", "レポート", "建設"] },
  { id: 2, title: "AIスコアリング改善", body: "LLMを活用した企業スコアリングモデルの精度向上プロジェクト", priority: "HIGH", tags: ["テクノロジー", "AI"] },
  { id: 3, title: "新規シグナルソース追加", body: "帝国データバンクAPIとの連携で倒産予測精度を向上", priority: "MEDIUM", tags: ["データ", "テクノロジー"] },
  { id: 4, title: "バトンズ連携強化", body: "バトンズ掲載企業の自動マッチング機能を実装", priority: "HIGH", tags: ["M&A", "マッチング"] },
  { id: 5, title: "地域別市場分析ダッシュボード", body: "都道府県別のM&A市場動向を可視化するサブダッシュボード", priority: "MEDIUM", tags: ["市場分析", "可視化"] },
  { id: 6, title: "自動メール文面生成", body: "企業プロフィールに基づいたパーソナライズドメール自動生成", priority: "LOW", tags: ["テクノロジー", "営業"] },
  { id: 7, title: "競合クローラー追加", body: "M&Aキャピタルパートナーズなど競合のプレスリリースを監視", priority: "MEDIUM", tags: ["データ", "競合"] },
  { id: 8, title: "Slack通知最適化", body: "アラート通知の優先度に基づくSlackチャンネル振り分け", priority: "LOW", tags: ["テクノロジー", "通知"] },
  { id: 9, title: "決算書AI解析", body: "アップロードされた決算書をAIで自動解析し企業スコアに反映", priority: "HIGH", tags: ["AI", "データ"] },
];

export const outreachDrafts = [
  { id: 1, company: "有限会社田中建設", subject: "事業承継のご相談", preview: "突然のご連絡失礼いたします。御社の事業承継について...", date: "2024-03-28", status: "draft" as const },
  { id: 2, company: "株式会社山田製造", subject: "M&Aアドバイザリーのご提案", preview: "貴社の製造技術の素晴らしさに注目しております...", date: "2024-03-28", status: "draft" as const },
  { id: 3, company: "渡辺電機株式会社", subject: "経営戦略のご相談", preview: "電機業界の動向について情報交換させていただけないか...", date: "2024-03-27", status: "draft" as const },
  { id: 4, company: "小林印刷株式会社", subject: "事業パートナーシップ", preview: "印刷業界の今後について貴重なお話を伺えれば...", date: "2024-03-27", status: "draft" as const },
];

export const outreachSent = [
  { id: 5, company: "佐藤商事株式会社", subject: "事業承継サポートのご案内", preview: "先日は商社業界のセミナーでお目にかかり...", date: "2024-03-25", status: "sent" as const },
  { id: 6, company: "吉田医療機器", subject: "医療機器分野のM&A動向", preview: "医療機器業界におけるM&A事例のご紹介...", date: "2024-03-24", status: "sent" as const },
];

export const outreachReplies = [
  { id: 7, company: "林建設工業株式会社", subject: "Re: 事業承継のご相談", preview: "ご連絡ありがとうございます。実は弊社でも事業承継について検討しておりました。来週お時間いただけますか？", date: "2024-03-28", status: "replied" as const },
  { id: 8, company: "清水化学工業", subject: "Re: 化学工業M&A情報", preview: "興味深い情報をありがとうございます。詳しい資料をお送りいただけますか？", date: "2024-03-27", status: "replied" as const },
  { id: 9, company: "伊藤金属工業", subject: "Re: 金属加工業の将来", preview: "お世話になっております。ご提案の件、社内で検討させていただきます。", date: "2024-03-26", status: "replied" as const },
];

export const crawlers = [
  { id: 1, url: "https://www.batonz.jp/searches", status: "active" as const, lastRun: "2024-03-28 14:30", nextRun: "2024-03-28 15:30", signals: 24 },
  { id: 2, url: "https://ma-navigator.com/sell", status: "active" as const, lastRun: "2024-03-28 14:15", nextRun: "2024-03-28 16:15", signals: 18 },
  { id: 3, url: "https://tdb.co.jp/tosan/", status: "warning" as const, lastRun: "2024-03-28 12:00", nextRun: "2024-03-28 18:00", signals: 42 },
  { id: 4, url: "https://corp.en-japan.com/", status: "active" as const, lastRun: "2024-03-28 13:45", nextRun: "2024-03-28 15:45", signals: 15 },
  { id: 5, url: "https://www.houjin-bangou.nta.go.jp/", status: "error" as const, lastRun: "2024-03-28 10:00", nextRun: "—", signals: 0 },
  { id: 6, url: "https://prtimes.jp/", status: "paused" as const, lastRun: "2024-03-27 22:00", nextRun: "—", signals: 31 },
  { id: 7, url: "https://news.yahoo.co.jp/business", status: "active" as const, lastRun: "2024-03-28 14:00", nextRun: "2024-03-28 15:00", signals: 8 },
];

export const alerts = [
  { id: 1, company: "有限会社田中建設", condition: "スコア > 90", enabled: true, lastTriggered: "2024-03-28 14:30", isNew: true },
  { id: 2, company: "株式会社山田製造", condition: "緊急度 = CRITICAL", enabled: true, lastTriggered: "2024-03-28 12:15", isNew: true },
  { id: 3, company: "渡辺電機株式会社", condition: "新規シグナル検知", enabled: true, lastTriggered: "2024-03-27 18:00", isNew: false },
  { id: 4, company: "小林印刷株式会社", condition: "スコア変動 > 10pt", enabled: false, lastTriggered: "2024-03-26 09:00", isNew: false },
  { id: 5, company: "林建設工業株式会社", condition: "倒産隣接シグナル", enabled: true, lastTriggered: "2024-03-28 08:45", isNew: true },
  { id: 6, company: "全企業", condition: "バトンズ新規掲載", enabled: true, lastTriggered: "2024-03-28 13:00", isNew: false },
  { id: 7, company: "清水化学工業", condition: "売上減少 > 15%", enabled: true, lastTriggered: "2024-03-25 16:30", isNew: false },
];
