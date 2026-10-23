# Kotoba Web

日本語学習者向けの単語学習・クイズ用ウェブアプリです。「みんなの日本語」の語彙リストを確認し、クイズ形式で練習できます。

## 主な機能

- 課ごとの語彙リスト
- ランダム出題のクイズ
- ライト / ダークテーマ切り替え
- 検索、課フィルター、ページネーション

## 使用技術

- Node.js
- Next.js
- React
- Firebase Realtime Database / Firestore
- Tailwind CSS

## ローカルでの実行

1. Firebase Web アプリの設定を `.env.example` を参考に `.env.local` に記入します。
2. 依存関係をインストールして開発サーバーを起動します。

```bash
npm install
npm run dev
```

ブラウザーで `http://localhost:3000` を開きます。

`.env.local` などの環境設定ファイルは Git に登録しないでください。
