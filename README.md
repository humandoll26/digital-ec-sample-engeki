# small-theater-ticket-sample

小劇場、演劇ユニット、自主企画イベント向けの、低機能・低コストなチケット販売ページテンプレートです。  
静的 HTML/CSS と Stripe を前提に、「高機能な予約システムを入れなくても、まず売れる導線を自前で持つ」ことを目的にしています。

制作・配布: 未完製作所

これは次のような人向けです。

- 予約システムの手数料や設定負荷をできるだけ抑えたい
- 多少の不便や運用カバーは受け入れられる
- GitHub Pages などの静的ホスティングで始めたい
- まずは小さく販売導線を持ちたい

## このテンプレートの考え方

このテンプレートは、便利さよりも継続しやすさを優先しています。

- 高機能な予約システムを目指さない
- エラーや例外はある程度起こる前提で運用で吸収する
- 受付では名前確認や購入完了メール確認で回す
- 完璧さより、無理なく続けられることを優先する

演劇や小劇場まわりでは、機能を増やすほど外部サービス依存と手数料負担が増えがちです。  
このサンプルは、その逆を狙ったテンプレートです。

## 収録ファイル

- `index.html`: 公演情報と予約導線をまとめたメインページ
- `thanks.html`: 決済完了後に表示するサンクスページ
- `styles.css`: メインページとサンクスページの共通スタイル
- `script.js`: Stripe Payment Link をつなぐ最小ロジック
- `LICENSE`: MIT License

## まず使う方法

一番簡単なのは Stripe Payment Link を使う方法です。

1. Stripe で Payment Link を作成する
2. `script.js` の `paymentLinkUrl` をその URL に差し替える
3. `index.html` と `thanks.html` を公開する
4. Stripe 側で決済完了後の遷移先を `thanks.html` に設定する

## 5分で導入

とにかく最短で公開したい場合は、次の4ステップだけで動かせます。

1. `script.js` の `paymentLinkUrl` を自分の Stripe Payment Link に変える
2. `index.html` の公演名、日時、会場、料金を差し替える
3. `thanks.html` の会場案内と受付案内を差し替える
4. GitHub Pages などにアップして、Stripe の完了後URLに `thanks.html` を設定する

まずはここまでで十分です。  
細かい調整や API 連携は、そのあと必要になってからで構いません。

## どこを差し替えればよいか

最低限、次だけ差し替えれば公開できます。

### `index.html`

- 公演名
- 日時
- 会場名と住所
- 料金
- FAQ
- 予約前の案内文

### `thanks.html`

- 公演名
- 会場案内
- 受付方法
- 遅刻時の案内

### `script.js`

- `paymentLinkUrl`

## `script.js` の役割

このテンプレートの基本運用では、`script.js` で設定するのは `paymentLinkUrl` だけです。

```js
const stripeConfig = {
  paymentLinkUrl: "https://buy.stripe.com/...",
  createCheckoutSessionUrl: "",
};
```

- `paymentLinkUrl`
  Stripe Payment Link の URL を入れます。静的サイトだけで始めるなら、まずはこちらで十分です。
- `createCheckoutSessionUrl`
  上級者向けです。自前サーバーで Checkout Session を作る場合に使います。未設定でも問題ありません。

## API 機能について

このテンプレートは、Payment Link を使う前提で配布しています。  
`createCheckoutSessionUrl` は拡張用として残していますが、初めての利用では無視して構いません。

つまり、基本の考え方は次です。

- 通常利用: Payment Link のみ
- 拡張したい場合: Checkout API を追加

## サンクスページの使い方

`thanks.html` は、購入直後に来場前の案内を見せるためのページです。

### Payment Link の場合

Stripe ダッシュボードで Payment Link を開き、完了後の遷移先 URL に `thanks.html` の公開 URL を設定します。

例:

```txt
https://example.com/thanks.html
```

### Checkout API の場合

Checkout Session 作成時の `success_url` に `thanks.html` を指定します。

例:

```txt
https://example.com/thanks.html?session_id={CHECKOUT_SESSION_ID}
```

## Stripe Payment Link でできること

このテンプレートの基本運用では、Stripe Payment Link を使う想定です。  
小劇場の簡易運用なら、以下の運用が可能です。

### 1. 購入時に名前を収集できる

Stripe 側の設定で、購入者の名前やメールアドレスを収集できます。  
そのため、受付では次のような運用がしやすくなります。

- 購入時の名前を確認する
- 必要に応じて購入完了メールも確認する

ただし、代表購入者の名前だけになる場合や、カード名義と来場者名が一致しない場合はあります。  
V1 では「代表者名を確認する」前提で割り切るのが現実的です。

### 2. 支払い完了メールを Stripe が送れる

Stripe は支払い完了後のメール送信を代行できます。  
このメールは「劇場独自の予約案内メール」というより、まずは「支払い完了メール」と考えるとわかりやすいです。

V1 では、次の組み合わせが扱いやすいです。

- Stripe の支払い完了メール
- `thanks.html` での来場案内

つまり、

- 支払い完了の通知は Stripe に任せる
- 当日の流れや会場案内は `thanks.html` で見せる

この分担にすると、手間を増やさずに最低限の案内が成立します。

## GitHub Pages で使う場合

GitHub Pages のような静的ホスティングでも、次までは実現できます。

- 公演ページの公開
- Stripe Payment Link への遷移
- 決済完了後の `thanks.html` 表示

ただし、静的サイトだけでは以下のようなことはできません。

- Webhook の受信
- 決済完了の厳密なサーバー検証
- 購入者ごとの自動メール送信
- 注文情報の保存

小規模公演の簡易運用なら、`thanks.html` と購入完了メールを案内に使い、受付で名前確認する方法でも回せます。

## Checkout API を使う場合

`createCheckoutSessionUrl` を設定すると、ボタン押下時にその API へ `POST` します。  
レスポンスは次の形式を返す前提です。

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_example"
}
```

最低限、サーバー側では次を設定してください。

- `success_url`: 決済完了後に戻す URL
- `cancel_url`: キャンセル時に戻す URL
- 商品やチケット種別に応じた Stripe の価格情報

## 公開前チェック

公開前に最低限ここだけ確認してください。

1. `script.js` の `paymentLinkUrl` を本物の Stripe URL に差し替えたか
2. `index.html` の公演名、日時、会場、料金を実際の内容に直したか
3. Stripe 側の決済完了後 URL を `thanks.html` に設定したか
4. 受付で何を確認するかを決めたか
   例: 名前確認のみ / 名前 + 購入完了メール確認
5. 当日の案内文
   開場時間、遅刻時の扱い、全席自由かどうか

## ライセンス

MIT License

