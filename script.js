const stripeConfig = {
  // 公開サンプルは架空公演。実際の公演と決済設定を用意した場合だけ false にする。
  demoMode: true,
  paymentLinkUrl: "",
  // TODO: Checkout API を使う場合のみ設定する。Payment Link だけなら空のままでよい
  createCheckoutSessionUrl: "",
};

function configuredUrl(value, kind) {
  if (typeof value !== "string" || /[\u0000-\u0020\u007f]/.test(value) ||
      /placeholder|example|\.\.\.|YOUR[_-]/i.test(value)) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    if (kind === "payment" && (url.hostname !== "buy.stripe.com" ||
        !/^\/(?:test_)?[a-zA-Z0-9]+$/.test(url.pathname))) return "";
    if (kind === "checkout" && (url.hostname !== "checkout.stripe.com" ||
        !url.pathname.startsWith("/c/pay/"))) return "";
    return url.href;
  } catch {
    return "";
  }
}

const paymentUrl = stripeConfig.demoMode === false ? configuredUrl(stripeConfig.paymentLinkUrl, "payment") : "";
const apiUrl = stripeConfig.demoMode === false ? configuredUrl(stripeConfig.createCheckoutSessionUrl, "api") : "";
const isDemo = !paymentUrl && !apiUrl;

const paymentLinkButton = document.getElementById("payment-link-button");
const checkoutButton = document.getElementById("checkout-button");
const checkoutStatus = document.getElementById("checkout-status");

document.querySelectorAll("[data-demo-only]").forEach((element) => { element.hidden = !isDemo; });
document.querySelectorAll("[data-live-only]").forEach((element) => { element.hidden = isDemo; });
document.querySelectorAll("[data-booking-label]").forEach((element) => {
  element.textContent = isDemo ? "デモの予約欄を見る" : "チケット予約の案内を見る";
});

if (paymentLinkButton) {
  if (paymentUrl) {
    paymentLinkButton.href = paymentUrl;
    paymentLinkButton.removeAttribute("aria-disabled");
    paymentLinkButton.removeAttribute("tabindex");
    paymentLinkButton.textContent = "Stripeでチケットを予約する";
  } else {
    paymentLinkButton.removeAttribute("href");
    paymentLinkButton.setAttribute("aria-disabled", "true");
    paymentLinkButton.setAttribute("tabindex", "-1");
    paymentLinkButton.textContent = isDemo ? "デモのため予約できません" : "Payment Linkは未設定です";
  }
  paymentLinkButton.addEventListener("click", (event) => { if (!paymentUrl) event.preventDefault(); });
  paymentLinkButton.addEventListener("keydown", (event) => {
    if (!paymentUrl && (event.key === "Enter" || event.key === " ")) event.preventDefault();
  });
}

if (checkoutButton && checkoutStatus) {
  checkoutButton.disabled = !apiUrl;
  checkoutButton.hidden = !apiUrl;
  checkoutButton.addEventListener("click", async () => {
    if (!apiUrl || checkoutButton.disabled) return;
    checkoutButton.disabled = true;

    checkoutStatus.textContent = "Checkout Session を作成しています...";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "small-theater-ticket",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();

      const url = configuredUrl(data.url, "checkout");
      if (!url) {
        throw new Error("Checkout URL is missing");
      }

      window.location.href = url;
    } catch (error) {
      checkoutStatus.textContent =
        "決済画面を開けませんでした。主催者へお問い合わせください。";
      console.error(error);
    } finally {
      checkoutButton.disabled = false;
    }
  });
}
