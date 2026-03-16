const stripeConfig = {
  // TODO: 自分の Stripe Payment Link に差し替える
  paymentLinkUrl: "https://buy.stripe.com/test_placeholder",
  // TODO: Checkout API を使う場合のみ設定する。Payment Link だけなら空のままでよい
  createCheckoutSessionUrl: "",
};

const paymentLinkButton = document.getElementById("payment-link-button");
const checkoutButton = document.getElementById("checkout-button");
const checkoutStatus = document.getElementById("checkout-status");

if (paymentLinkButton) {
  paymentLinkButton.href = stripeConfig.paymentLinkUrl;
}

if (checkoutButton && checkoutStatus) {
  checkoutButton.addEventListener("click", async () => {
    if (!stripeConfig.createCheckoutSessionUrl) {
      checkoutStatus.textContent =
        "createCheckoutSessionUrl が未設定です。最短で試すなら paymentLinkUrl を本物の Stripe Payment Link に差し替えてください。";
      return;
    }

    checkoutStatus.textContent = "Checkout Session を作成しています...";

    try {
      const response = await fetch(stripeConfig.createCheckoutSessionUrl, {
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

      if (!data.url) {
        throw new Error("Checkout URL is missing");
      }

      window.location.href = data.url;
    } catch (error) {
      checkoutStatus.textContent =
        "Checkout Session の作成に失敗しました。API レスポンス形式と URL 設定を確認してください。";
      console.error(error);
    }
  });
}
