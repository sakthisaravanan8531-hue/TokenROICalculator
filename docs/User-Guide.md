# AI MODEL CATALOG & TOKEN ROI CALCULATOR
## End-to-End User Manual & Step-by-Step Visual Guide
**A Complete Guide for AI Engineers, Architects & Financial Decision-Makers with Screenshots of Every Page**

---

**AI Model Catalog & Token ROI Calculator** is an enterprise cloud intelligence platform powered by AWS Serverless architecture and Google Gemini AI. This document provides complete operating instructions for all users, including machine learning engineers evaluating foundation models, enterprise architects designing workload pipelines, and CFOs/finance teams forecasting multi-model token expenses.

| Specification | System Configuration |
|---|---|
| **Live Web App URL:** | `https://main.d25o9rjld4bvxg.amplifyapp.com` |
| **AWS Region & Hosting:** | AWS Amplify (Mumbai `ap-south-1`) & API Gateway REST API |
| **Model Catalog Database:** | Amazon DynamoDB (`AIModelCatalog-prod`) — 828+ Live Models |
| **Default AI Advisor Model:** | Google Gemini AI (`gemini-3.1-flash-lite` / `3.5-flash-lite` Fallback Pool) |
| **Automated Catalog Sync:** | Amazon EventBridge Daily Cron (`cron(0 2 * * ? *)`) via Lambda |
| **Supported Workload Currency:** | USD ($) and Indian Rupee (₹ INR at ₹84.5/USD) |

---

### TABLE OF CONTENTS

| PART 1: MODEL DISCOVERY & CATALOG | PART 2: WORKLOAD ROI & AI ADVISOR |
|---|---|
| • 1. Platform Header & Navigation Overview<br>• 2. All Catalog Models Directory (828 Models)<br>• 3. Frontier Models Dedicated Tab (125 Models)<br>• 4. Dynamic Domain & Field Taxonomy Filtering | • 5. Token ROI Calculator & Workload Sizing<br>• 6. Batch Pricing, INR Currency & Cloud Markups<br>• 7. Searchable Combobox & Model Selection<br>• 8. In-Depth Model Details & Benchmark Inspector<br>• 9. Interactive AI Model Advisor Consultation<br>• 10. Automated Daily Refresher & System Architecture |

---

<br>

## 1. Full Model Catalog — Complete Directory (828 Models)

The **All Catalog Models** view is the primary intelligence repository, aggregating 828 models from leading commercial labs (OpenAI, Anthropic, Google DeepMind, Mistral, Meta, Alibaba, IBM) and open-source foundations.

```
AI MODEL CATALOG & TOKEN ROI CALCULATOR • OFFICIAL USER GUIDE & OPERATION MANUAL                    VERSION 2.0.0 (LIVE)
```

### Step-by-Step Instructions:
1. Navigate to the top navigation bar and select **Full Catalog**.
2. Ensure the **All Catalog Models (828)** sub-tab is active.
3. Use the search bar to locate models by name, provider, or domain (e.g., `Aion`, `Docling`, `DeepSeek`).
4. Filter models by selecting a specific sector from the **All Domains & Fields** dropdown or **All Providers**.
5. Click any column header (**Model Name**, **Provider**, **Domain & Field**) to toggle A–Z or Z–A alphabetical sorting.
6. Click the **Details ↗** button on any row to open the complete architectural specification.

![Figure 1: All Catalog Models Directory Screen](/C:/Users/sakthivel.senthil_cl/.gemini/antigravity/brain/d2b1e0b8-70c7-4f34-8ed4-74559982de7f/guide_images/all_catalog_828.jpg)
*Figure 1: Complete Catalog View showing 828 models sorted A–Z with input/output rates and accuracy tiers.*

> [!TIP]
> **Pro-Tip:** The catalog dynamically displays token pricing in **$/1M tokens** along with estimated single-call cost benchmarks assuming standard 2,000 input + 500 output tokens.

---

<br>

## 2. Frontier Models — Flagship Foundation Tab (125 Models)

The **Frontier Models** sub-tab provides a curated directory of the 125 highest-performing foundation models, featuring detailed licensing terms, per-second pricing, and token context limits.

```
AI MODEL CATALOG & TOKEN ROI CALCULATOR • OFFICIAL USER GUIDE & OPERATION MANUAL                    VERSION 2.0.0 (LIVE)
```

### Step-by-Step Instructions:
1. From the **Full Catalog** view, click on the **⚡ Frontier Models (125)** sub-tab.
2. The grid automatically filters down to flagship frontier models (e.g. `Alibaba Wan 3.0 / Wan 2.2`, `Alpamayo 1`, `AlphaFold 3 / Boltz-2`).
3. Inspect the **License / Access** column to verify whether weights are Open-Source (e.g., MIT, Apache 2.0) or Managed Commercial APIs.
4. Review the **Pricing** column for specialized cost models (e.g., `$0.20/sec video gen`, `Free AF3 Server`, or `Self-hosted 10B parameters`).
5. Check the **Token / Limits** column for context boundaries (e.g., *Up to 30 sec clips at 1080p*, *Multi-camera driving video*).

![Figure 2: Frontier Models Curated Sub-View](/C:/Users/sakthivel.senthil_cl/.gemini/antigravity/brain/d2b1e0b8-70c7-4f34-8ed4-74559982de7f/guide_images/frontier_models_125.jpg)
*Figure 2: Frontier Models Directory showing open-weight licenses, hardware limits, and specialized pricing.*

> [!TIP]
> **Pro-Tip:** Frontier models can be directly cross-referenced in the ROI Calculator to compare self-hosted GPU infrastructure against managed API pricing.

---

<br>

## 3. Token ROI Calculator — Workload Cost Modeling

The **Token ROI Calculator** allows enterprise architects and engineering leaders to accurately forecast multi-model monthly and annual API expenditures.

```
AI MODEL CATALOG & TOKEN ROI CALCULATOR • OFFICIAL USER GUIDE & OPERATION MANUAL                    VERSION 2.0.0 (LIVE)
```

### Step-by-Step Instructions:
1. Click the **▤ Token ROI Calculator** tab on the navigation bar.
2. Under the **Workload** panel, enter your production sizing parameters:
   - **Requests / day:** Daily query volume (e.g. `25,000`).
   - **Input tokens / req:** Average prompt size, including RAG context and system instructions (e.g. `2,000`).
   - **Output tokens / req:** Expected generation tokens per response (e.g. `500`).
   - **Days / month:** Operating billing days (e.g. `30`).
3. Toggle interactive options as needed:
   - **Batch pricing (50% OFF):** Click the checkbox to apply official 50% batch inference discounts.
   - **Show ₹ INR (₹84.5/USD):** Click to convert all costs into Indian Rupees.
   - **Cloud provider markup:** Click to incorporate enterprise hosting overheads (AWS +15%, Azure +18%, GCP +12%).
4. In the **Cost Comparison** panel, use the searchable combobox to find and add models.
5. Click **⚡ Calculate Costs** to generate ranked comparison tables, savings metrics, and CSV exports.

![Figure 3: Token ROI Calculator Workload Configuration](/C:/Users/sakthivel.senthil_cl/.gemini/antigravity/brain/d2b1e0b8-70c7-4f34-8ed4-74559982de7f/guide_images/token_roi_calculator.jpg)
*Figure 3: Workload sizing interface with interactive checkboxes, live search box, and calculation triggers.*

> [!TIP]
> **Pro-Tip:** Need to evaluate fine-tuned proprietary weights? Expand **▶ + Custom pricing** to enter custom model names and $/1M token rates to compare against public commercial APIs.

---

<br>

## 4. Model Details & Benchmark Inspector

The **Model Details** tab provides an in-depth technical dossier for any foundation model in the catalog.

```
AI MODEL CATALOG & TOKEN ROI CALCULATOR • OFFICIAL USER GUIDE & OPERATION MANUAL                    VERSION 2.0.0 (LIVE)
```

### Step-by-Step Instructions:
1. Select the **⬡ Model Details** tab from the main header.
2. In the **Search models** input, start typing the model name or ID (e.g. `Aion-2.0`).
3. Select the desired model from the dropdown list.
4. The screen instantly renders the full technical breakdown:
   - **Accuracy & Benchmark Tier:** Verified benchmark performance (e.g., *High Fast-Tier (84–89%) — Sub-second response & structured JSON extraction*).
   - **Domain & Field:** Primary modality classification (e.g., *Budget & Fast*, *Coding & Agents*).
   - **Pricing:** Exact input and output rates per 1M tokens.
   - **License / Access:** Gateway hosting provider or open-source weight distribution channel.
   - **Use Cases & Strengths:** Optimal deployment scenarios and technical advantages.

![Figure 4: Model Technical Dossier & Benchmark Inspector](/C:/Users/sakthivel.senthil_cl/.gemini/antigravity/brain/d2b1e0b8-70c7-4f34-8ed4-74559982de7f/guide_images/model_details_inspector.jpg)
*Figure 4: Architectural deep-dive card detailing benchmark tiers, rate cards, and technical strengths.*

> [!TIP]
> **Pro-Tip:** Click the **View pricing or model source** link under the Documentation tile to inspect the upstream provider documentation and release notes.

---

<br>

## 5. AI Model Advisor — Intelligent Multi-Turn Consultation

Powered by **Google Gemini AI**, the **AI Model Advisor** acts as an autonomous AI solutions architect, diagnosing project requirements and prescribing ranked models from the 828-model DynamoDB catalog.

```
AI MODEL CATALOG & TOKEN ROI CALCULATOR • OFFICIAL USER GUIDE & OPERATION MANUAL                    VERSION 2.0.0 (LIVE)
```

### Step-by-Step Instructions:
1. Navigate to the **⚡ AI Advisor** tab.
2. In the **Describe your use case** textarea, describe your technical requirements in natural language (or click one of the quick example pills below).
3. Optionally select a **Domain & Field** (or keep *Auto-Detect / All Domains*).
4. Set a **Max Input Price ($/1M tokens)** if operating under strict budget caps.
5. Click **Next: Clarify Requirements →**.
6. The Gemini engine formulates **4 targeted multiple-choice questions** exploring:
   - Volume and latency (real-time sub-second vs. batch processing).
   - Data privacy and residency constraints (cloud API vs. on-premises self-hosted).
   - Accuracy vs. cost trade-offs (reasoning capability vs. throughput).
   - Structural output fidelity (raw text vs. schema-validated JSON).
7. Select your answers and click **View Ranked Recommendations 🚀**.
8. The advisor delivers:
   - **Top 3 Best-Fit Models:** Ranked by capability and task alignment.
   - **Top 3 Cost-Competitive Models:** Cost-effective alternatives offering high price-performance.

![Figure 5: AI Model Advisor Consultation Screen](/C:/Users/sakthivel.senthil_cl/.gemini/antigravity/brain/d2b1e0b8-70c7-4f34-8ed4-74559982de7f/guide_images/ai_advisor.jpg)
*Figure 5: AI Advisor prompt interface featuring use case input, domain selector, budget constraints, and quick templates.*

> [!TIP]
> **Pro-Tip:** The backend uses an automatic multi-model fallback pool (`gemini-3.1-flash-lite` → `gemini-3.5-flash-lite` → `gemini-3.5-flash`) with exponential backoff, preventing high-demand 503 errors during traffic spikes.

---

<br>

## 6. Architecture, Daily Synchronization & API Reference

```
AI MODEL CATALOG & TOKEN ROI CALCULATOR • OFFICIAL USER GUIDE & OPERATION MANUAL                    VERSION 2.0.0 (LIVE)
```

### Automated Synchronization:
* **EventBridge Schedule:** Evaluates daily at `02:00 UTC` (`cron(0 2 * * ? *)`).
* **Daily Refresher Lambda (`token-roi-daily-refresher-prod`):** Ingests updated rate sheets, validates domain taxonomy, and synchronizes items into DynamoDB (`AIModelCatalog-prod`) with zero downtime.
* **Manual Refresh Command:**
  ```powershell
  aws lambda invoke --function-name token-roi-daily-refresher-prod --region ap-south-1 response.json
  ```

### REST API Gateway Endpoints (`https://fula8ai0tf.execute-api.ap-south-1.amazonaws.com/prod`):
| Endpoint | Method | Purpose | Sample Request / Query |
|---|---|---|---|
| `/catalog` | `GET` | Fetches all models from DynamoDB | `?category=Document+Parsing+%26+OCR` |
| `/catalog/{id}` | `GET` | Fetches single model specifications | `/catalog/aion-2.0` |
| `/advisor` | `POST` | Generates 4 clarifying questions | `{"action": "clarify", "useCase": "...", "taskType": "..."}` |
| `/advisor` | `POST` | Returns ranked recommendations | `{"action": "recommend", "useCase": "...", "answers": {...}}` |

---

<br>

## Frequently Asked Questions & Troubleshooting

```
AI MODEL CATALOG & TOKEN ROI CALCULATOR • OFFICIAL USER GUIDE & OPERATION MANUAL                    VERSION 2.0.0 (LIVE)
```

| Question | Resolution & Best Practice |
|---|---|
| **Why did the Advisor previously show a `503 UNAVAILABLE` error?** | Google's public endpoints occasionally experience surges on a single model tier. The Lambda backend now has a multi-model fallback pool (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`) with exponential retry backoff, ensuring uninterrupted service. |
| **How does Batch Pricing affect calculated estimates?** | Toggling *Batch pricing* applies a standard 50% discount to both input and output token rates, modeling asynchronous batch endpoints (e.g. OpenAI Batch, Anthropic Message Batches). |
| **Can I compare private or fine-tuned custom models?** | Yes. In the Token ROI Calculator tab, expand **+ Custom pricing**, enter your model name and token rates, and click *Add Custom Model* to include it in the comparison matrix. |
| **How do I export comparison results for budgeting reports?** | After clicking *⚡ Calculate Costs*, click the **📊 Export CSV** button to download a spreadsheet (`token-roi-comparison.csv`) containing model names, providers, daily costs, monthly costs, and annual costs. |

---

```
CONFIDENTIAL & PROPRIETARY • AI MODEL CATALOG & TOKEN ROI SYSTEM               PAGE 1 OF 6
```
