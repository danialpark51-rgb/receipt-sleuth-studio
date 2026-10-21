# Receipt Sleuth Studio

Build a professional, modern, responsive web application named ReceiptIQ — AI Autonomous Receipt Intelligence and Expense Investigation Platform.

For this first stage, build the complete frontend foundation only. Do not pretend that backend, AI, authentication, or database functionality is connected yet.

Design requirements

- Premium fintech SaaS design with a clean white background, deep navy text, subtle blue accents, elegant cards, and professional typography.
- Fully responsive on Android mobile, tablets, and desktop.
- Persistent sidebar navigation on desktop and a mobile-friendly navigation menu.
- Accessible buttons, clear loading states, empty states, error messages, and confirmation dialogs.
- Consistent spacing, polished icons, realistic sample data, and professional dashboard charts.

Create these pages

1. Landing page explaining the platform and its benefits.
2. Login and sign-up screens as frontend placeholders.
3. Dashboard with receipt count, expenses analyzed, anomalies detected, risk summary, recent investigations, and spending charts.
4. Receipt Intelligence page with an upload area and extracted-receipt preview using clearly labelled demonstration data.
5. Expense Audit page displaying item calculations, tax checks, total discrepancies, and audit results.
6. Duplicate Detection page showing possible duplicate receipts and matching evidence.
7. Receipt Authenticity page displaying potential alteration indicators and confidence labels.
8. Investigation Center showing suspicious cases, investigation steps, evidence, risk levels, and report previews.
9. Traveller Fair-Price page allowing users to enter a product, location, and quoted price, with a clearly labelled demonstration comparison.
10. Receipt History page with searchable, filterable receipt records.
11. Settings page with profile, preferences, and account sections.

Navigation and interactions

- Every navigation item must open the correct page.
- Search, filters, tabs, dialogs, and menus should work in the frontend.
- Provide realistic demonstration data and clearly distinguish it from verified results.
- Do not claim that demo analysis detects real fraud or uses live market prices.
- Use reusable components and maintainable TypeScript and React code.
- Do not remove or hide any of the eleven pages listed above.

Technical constraints

- Use React, TypeScript, Tailwind CSS, and reusable UI components supported by the project environment.
- Organize the code for later integration with Supabase authentication, PostgreSQL, secure file storage, server-side AI processing, and investigation APIs.
- Do not hardcode secrets or expose API keys in the browser.
- Do not add unnecessary paid services or dependencies.

First deliver a polished, navigable frontend foundation. Real backend functionality will be implemented and tested in subsequent stages.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://receipt-sleuth-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/31cb8ded-7a2b-433c-acd8-0ac9daadb044).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
