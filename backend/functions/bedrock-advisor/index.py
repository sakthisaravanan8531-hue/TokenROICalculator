"""
Gemini Advisor Lambda — AI-powered model recommendation
Features:
1. Multi-model resilience pool: automatically tries [gemini-3.1-flash-lite, gemini-3.5-flash-lite, gemini-3.5-flash, gemini-flash-lite-latest]
2. Automatic exponential backoff retry on 503 (high demand) or 429 (rate limit)
3. Action "clarify": creates tailored multiple choice questions
4. Action "recommend": returns ranked best_fit & cost_competitive models
"""
import json
import os
import time
import urllib.request
import urllib.error
import boto3
from decimal import Decimal

TABLE_NAME = os.environ["TABLE_NAME"]
GEMINI_KEY_PARAM = os.environ.get("GEMINI_KEY_PARAM", "/token-roi/prod/gemini-api-key")

# Multi-model pool in order of speed and availability
CANDIDATE_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
ssm = boto3.client("ssm")

_cached_api_key = None

def get_gemini_api_key():
    global _cached_api_key
    if _cached_api_key:
        return _cached_api_key
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        _cached_api_key = key
        return key
    resp = ssm.get_parameter(Name=GEMINI_KEY_PARAM, WithDecryption=True)
    _cached_api_key = resp["Parameter"]["Value"]
    return _cached_api_key

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def respond(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, default=decimal_default),
    }

def call_gemini_with_fallback(prompt):
    api_key = get_gemini_api_key()
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }
    data_bytes = json.dumps(payload).encode("utf-8")

    last_error = None
    # Iterate through candidate models with retry backoff
    for model in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        for attempt in range(2): # 2 attempts per model
            try:
                req = urllib.request.Request(
                    url,
                    data=data_bytes,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=18) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))

                candidates = resp_data.get("candidates", [])
                if not candidates:
                    raise ValueError("Gemini returned empty candidate list")
                text = candidates[0]["content"]["parts"][0]["text"].strip()
                parsed = json.loads(text)
                return parsed, model, resp_data.get("usageMetadata", {})

            except urllib.error.HTTPError as e:
                last_error = e
                # If 503 (Overloaded) or 429 (Rate limited), pause briefly and retry
                if e.code in (503, 429, 500):
                    time.sleep(1.0 + attempt * 1.5)
                    continue
                else:
                    # Non-retryable HTTP error for this model, try next candidate
                    break
            except Exception as e:
                last_error = e
                time.sleep(0.5)
                continue

    if last_error:
        raise last_error
    raise RuntimeError("All Gemini models in fallback pool failed to respond")

def handle_clarify(user_query, task_type):
    prompt = f"""You are an enterprise AI architecture advisor. A user has described the following use case:
"{user_query}"
Target domain / modality: {task_type or "General"}

To recommend the ideal AI models from a catalog of 800+ models, formulate 4 to 5 relevant, in-depth clarifying multiple-choice questions specifically tailored to this use case.
Explore deep domain-specific nuances, such as:
1. Specific sub-task types and modalities (e.g., document parsing vs bounding box extraction, coding autocomplete vs multi-file agentic loop, voice conversation vs translation)
2. Expected request volume, throughput, and latency limits (e.g., real-time sub-second vs batch vs async)
3. Quality vs cost trade-offs (e.g., state-of-the-art frontier reasoning vs high-throughput budget flash models)
4. Context window length and document complexity (e.g., short queries vs 100+ page technical manuals vs 1M tokens)
5. Deployment & privacy constraints (e.g., strict GDPR/data sovereignty, open-weight on-premises deployment, proprietary cloud API)

Return STRICTLY valid JSON in this format:
{{
  "useCaseSummary": "<1-2 sentence understanding of their core goal>",
  "questions": [
    {{
      "id": "q1",
      "question": "<The question text>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"]
    }}
  ]
}}"""
    data, model_used, _ = call_gemini_with_fallback(prompt)
    data["_modelUsed"] = model_used
    return respond(200, data)

def get_catalog_summary(task_type=None, budget=None):
    items = []
    scan_kwargs = {}
    done = False
    start_key = None
    while not done:
        if start_key:
            scan_kwargs["ExclusiveStartKey"] = start_key
        resp = table.scan(**scan_kwargs)
        items.extend(resp.get("Items", []))
        start_key = resp.get("LastEvaluatedKey")
        done = start_key is None

    compact = []
    for m in items:
        entry = {
            "modelId": m.get("modelId", ""),
            "name": m.get("name", ""),
            "provider": m.get("provider", ""),
            "category": m.get("category", ""),
            "inputPrice": float(m.get("inputPrice", 0) or 0),
            "outputPrice": float(m.get("outputPrice", 0) or 0),
            "accuracy": m.get("accuracy", ""),
            "useCase": (m.get("useCase", "") or "")[:180],
            "basis": m.get("basis", ""),
        }
        if budget and entry["inputPrice"] > budget:
            continue
        compact.append(entry)
    return compact

def handle_recommend(user_query, answers, budget, task_type):
    catalog = get_catalog_summary(task_type=task_type, budget=budget)
    if not catalog:
        return respond(404, {"error": "No models match budget/task criteria"})

    if task_type:
        domain_matches = [m for m in catalog if task_type.lower() in m.get("category", "").lower()]
        other_matches = [m for m in catalog if task_type.lower() not in m.get("category", "").lower()]
        catalog = domain_matches + other_matches

    catalog_text = json.dumps(catalog[:180], separators=(",", ":"))
    answers_text = json.dumps(answers, indent=2) if answers else "None provided"

    prompt = f"""You are an enterprise AI model selection advisor.
Your job is to recommend the absolute best AI models from the catalog based on the user's requirements.

USER USE CASE:
{user_query}

USER CLARIFICATIONS & SPECIFIC ANSWERS:
{answers_text}

TARGET DOMAIN / FIELD:
{task_type or "Auto-detect"}

AI MODEL CATALOG ({len(catalog[:180])} models):
{catalog_text}

Instructions:
1. Provide exactly 3 "best_fit" models (highest capability, accuracy, benchmark leader for the specific task).
2. Provide exactly 3 "cost_competitive" models (best price-performance ratio or open-weight/budget alternative).
3. Base choices on the user's answers and accuracy tiers.
4. Output STRICTLY JSON without markdown fences.

Format:
{{
  "understanding": "<2-3 sentence tailored analysis incorporating their answers>",
  "best_fit": [
    {{"modelId": "...", "name": "...", "provider": "...", "reason": "...", "confidence": 0.95}}
  ],
  "cost_competitive": [
    {{"modelId": "...", "name": "...", "provider": "...", "reason": "...", "confidence": 0.88}}
  ],
  "domain": "<primary domain>",
  "key_requirements": ["<req 1>", "<req 2>", "<req 3>"]
}}"""

    result, model_used, usage = call_gemini_with_fallback(prompt)

    catalog_map = {m["modelId"]: m for m in catalog}
    for group in ["best_fit", "cost_competitive"]:
        enriched = []
        for rec in result.get(group, []):
            mid = rec.get("modelId", "")
            full = catalog_map.get(mid, {})
            enriched.append({
                **rec,
                "inputPrice": full.get("inputPrice", 0),
                "outputPrice": full.get("outputPrice", 0),
                "accuracy": full.get("accuracy", rec.get("accuracy", "")),
                "category": full.get("category", ""),
                "source": full.get("source", ""),
                "basis": full.get("basis", ""),
            })
        result[group] = enriched

    result["_meta"] = {
        "model": f"google/{model_used}",
        "inputTokens": usage.get("promptTokenCount", 0),
        "outputTokens": usage.get("candidatesTokenCount", 0),
        "catalogSize": len(catalog),
    }
    return respond(200, result)

def handler(event, context):
    method = event.get("httpMethod", "POST")
    if method == "OPTIONS":
        return respond(200, {})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return respond(400, {"error": "Invalid JSON body"})

    action = body.get("action", "recommend")
    user_query = (body.get("query") or body.get("useCase") or "").strip()

    if not user_query:
        return respond(400, {"error": "query field is required"})

    task_type = body.get("taskType")
    budget = body.get("maxBudget")
    answers = body.get("answers")

    try:
        if action == "clarify":
            return handle_clarify(user_query, task_type)
        else:
            return handle_recommend(user_query, answers, budget, task_type)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        print(f"Gemini HTTP Error {e.code}: {err_msg}")
        return respond(502, {"error": f"Gemini API returned {e.code}: {err_msg}"})
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        return respond(500, {"error": f"Internal error: {str(e)}"})
