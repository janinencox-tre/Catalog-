# TRE 2025 Product Catalog

This is the product catalog and quote builder site for **The Rented Event**.

## 🚀 One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/therentedevent/catalog)

## ⚙️ Updating Site Defaults

To update delivery fee, setup fee, tax, or disclaimer, edit the following section in `index.html` (inside a <script> tag):

```js
window.TRE_SETTINGS = {
  disclaimer: "Quote valid for 7 days.",
  deliveryFee: 100,   // Default delivery fee ($)
  setupFee: 50,       // Default setup fee ($)
  taxRate: 8          // Default tax percentage (%)
};
```

- **disclaimer** → text shown in all quotes
- **deliveryFee** → default delivery fee in dollars
- **setupFee** → default setup fee in dollars
- **taxRate** → default tax percentage

## 🛠 Local Testing
Just open `index.html` in your browser or serve with any static server.

## 🌐 Deployment
1. Push this folder to a GitHub repo (e.g., `therentedevent/catalog`).
2. Click the **Deploy to Netlify** button above.
3. Netlify will clone the repo and deploy your site automatically.
