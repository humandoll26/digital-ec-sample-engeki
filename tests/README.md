# デモ・設定分岐の検証

Node.js、PlaywrightとGoogle Chromeを用意し、リポジトリを
`python -m http.server 8765 --bind 127.0.0.1`等でローカル配信します。

```powershell
$env:BASE_URL = 'http://127.0.0.1:8765/'
node tests/demo-regression.cjs
```

別の場所のPlaywrightは`PLAYWRIGHT_MODULE`に絶対パスを指定します。
毎回新規コンテキストを使用し、外部通信を遮断します。Checkout APIはスタブです。
デモ・未設定・placeholder・不正URL・明示的なデモ設定、キーボード操作、
完了ページの直接表示、JavaScriptなし、有効なPayment LinkとAPIの分岐、
危険なAPI返却URLの拒否を検証します。実決済やStripe設定変更は行いません。
