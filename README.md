# AI Model Catalog & Token ROI Calculator

[Open the calculator](https://sakthisaravanan8531-hue.github.io/TokenROICalculator/)

Compare AI model prices, estimate token spend, and compare selected models. The application runs in the browser and requires no API key.

## Features

- **Cost dashboard** — Compare daily, monthly, and annual spend, view a monthly cost chart, and download the comparison as CSV.
- **Model catalog** — Search and filter 682 catalog entries by category, provider, or the **New models** flag. Open individual entries for capabilities, use cases, and source links.
- **Custom pricing** — Add a model using your own input and output rates per million tokens.
- **Use-case advisor** — Describe the job, answer a task-specific follow-up, and review model or tool suggestions. Video workflows distinguish editing existing footage from generating new clips.
- **Domain Leaders** — Review price rankings and documented use-case fit for selected comparison models.

## How to use it

1. Enter the expected daily requests, input and output tokens per request, and days per month.
2. Add one or more models to estimate their costs.
3. Select **Calculate costs**, then review the dashboard or download the selected model costs as CSV.

## Pricing and recommendation methodology

The catalog is a snapshot dated 11 November 2026. Source links are available in Model Details. Token cost estimates use published base input and output rates. Monthly spend uses the configured days per month, and annual spend uses 365 days. Estimates exclude discounts, additional fees, and infrastructure costs. Verify provider rates before using an estimate in a proposal.

The advisor matches task requirements to documented capabilities and catalog notes. Cost rankings require comparable rates. Where the tool uses a separate billing model, consult the linked provider plan.

## Run locally

From the repository root, run:

```bash
python -m http.server 8000 --directory docs
```

Open <http://localhost:8000/>. The application uses PyScript to run Python in the browser and needs internet access to load the runtime.

## Deploy

GitHub Pages publishes the static app from **main → /docs**. Update `docs/index.html`, `docs/dashboard.css`, and `docs/calculator.py` to change the hosted application. The earlier Vite source remains in the repository for reference. Its build also writes to `docs/`, so use the local command above to preview the Python app.
