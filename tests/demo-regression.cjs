const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765/digital-ec-sample-engeki/';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Local tests only');

(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const script = await fs.readFile(path.join(__dirname, '..', 'script.js'), 'utf8');
  const run = async (config, expected) => {
    const context = await browser.newContext();
    const page = await context.newPage(); const posts = [], navigations = [], errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() === 'POST') {
        posts.push({url:request.url(), body:request.postData()});
        return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({url:expected.returnUrl || 'https://checkout.stripe.com/c/pay/cs_test_synthetic'})});
      }
      if (request.url() === new URL('script.js', base).href && config) {
        return route.fulfill({contentType:'application/javascript', body:script.replace(/const stripeConfig = \{[\s\S]*?\};/, 'const stripeConfig = ' + JSON.stringify(config) + ';')});
      }
      if (url.hostname !== '127.0.0.1') { navigations.push(request.url()); return route.abort(); }
      return route.continue();
    });
    await page.goto(base);
    const button = page.locator('#payment-link-button');
    if (expected.demo) {
      assert.equal(await button.getAttribute('href'), null); assert.equal(await button.getAttribute('aria-disabled'), 'true');
      assert.equal(await button.getAttribute('tabindex'), '-1'); assert(await page.locator('#checkout-button').isDisabled());
      assert((await page.locator('.demo-notice').first().innerText()).includes('架空公演のデモです。予約・決済はできません'));
      await button.click(); await button.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
      await page.evaluate(() => document.querySelector('#checkout-button').click());
      assert.equal(posts.length, 0); assert.equal(page.url(), base);
      assert(!navigations.some(url => /stripe\.com/.test(url)));
      await page.goto(new URL('thanks.html', base).href);
      assert(!(await page.locator('h1').innerText()).includes('ありがとうございます'));
      assert(await page.locator('.demo-notice').isVisible());
      assert((await page.locator('body').innerText()).includes('購入完了の証明ではありません'));
      assert.equal(posts.length, 0);
    } else {
      assert.equal(await page.locator('.demo-notice').first().isVisible(), false);
      if (expected.payment) assert.equal(await button.getAttribute('href'), expected.payment);
      if (expected.api) {
        assert(!(await page.locator('#checkout-button').isDisabled()));
        assert.equal(posts.length, 0); // No startup request.
        await page.locator('#checkout-button').click();
        await page.waitForTimeout(200);
        assert.equal(posts.length, 1); assert.equal(posts[0].url, expected.api);
        assert.equal(JSON.parse(posts[0].body).productId, 'small-theater-ticket');
        if (expected.returnUrl) { assert.equal(page.url(), base); assert((await page.locator('#checkout-status').innerText()).includes('開けません')); }
        else assert(navigations.some(url => url.startsWith('https://checkout.stripe.com/c/pay/')));
      }
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    if (process.env.TEST_OUTPUT && !config) await page.screenshot({path:path.join(process.env.TEST_OUTPUT, 'ec-thanks.png'),fullPage:true});
    await context.close();
  };
  await run(null, {demo:true});
  await run({demoMode:false,paymentLinkUrl:'https://buy.stripe.com/test_placeholder',createCheckoutSessionUrl:''},{demo:true});
  await run({demoMode:false,paymentLinkUrl:'javascript:marker',createCheckoutSessionUrl:'https://example.com/placeholder'},{demo:true});
  await run({demoMode:true,paymentLinkUrl:'https://buy.stripe.com/test_synthetic123',createCheckoutSessionUrl:''},{demo:true});
  await run({demoMode:false,paymentLinkUrl:'https://buy.stripe.com/test_synthetic123',createCheckoutSessionUrl:''},{payment:'https://buy.stripe.com/test_synthetic123'});
  await run({demoMode:false,paymentLinkUrl:'',createCheckoutSessionUrl:'https://checkout-api.invalid/session'},{api:'https://checkout-api.invalid/session'});
  await run({demoMode:false,paymentLinkUrl:'',createCheckoutSessionUrl:'https://checkout-api.invalid/session'},{api:'https://checkout-api.invalid/session',returnUrl:'javascript:marker'});
  // Static fallback also prevents payments without JavaScript.
  const context = await browser.newContext({javaScriptEnabled:false}); const page = await context.newPage();
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto(base); assert.equal(await page.locator('#payment-link-button').getAttribute('href'), null);
  assert(await page.locator('.demo-notice').first().isVisible()); await context.close();
  console.log('PASS: EC default/placeholder/invalid/explicit demo, keyboard, no unconfigured requests, thanks, valid Payment Link and stub Checkout API, bad API redirect, no-JS fallback');
  await browser.close();
})().catch(error => {console.error(error); process.exit(1);});
