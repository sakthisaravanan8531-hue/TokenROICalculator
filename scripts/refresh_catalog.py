"""Refresh the published calculator catalog from Models.dev."""
import argparse
import ast
from hashlib import sha256
from datetime import date
import json
import math
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

API_URL = "https://models.dev/api.json"
START = "CATALOG = r'''\n"
END = "\n'''"
DIRECT_PROVIDERS = {
    "openai", "anthropic", "google", "deepseek", "mistral", "cohere", "xai",
}
PROVIDER_NAMES = {"mistral ai": "mistral"}


def token_rates(model):
    cost = model.get("cost") or {}
    rates = [cost.get(field) for field in ("input", "output")]
    if all(type(rate) in (int, float) and math.isfinite(rate) and rate >= 0 for rate in rates):
        return rates
    return None


def retired_model_ids(calculator_source):
    for statement in ast.parse(calculator_source).body:
        if isinstance(statement, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id == "RETIRED_MODEL_IDS"
            for target in statement.targets
        ):
            return ast.literal_eval(statement.value)
    raise ValueError("Calculator retirement list is missing")


def refresh(snapshot, upstream, retired_ids):
    inactive_ids = retired_ids | {
        f"{provider_id}/{model_id}"
        for provider_id, provider in upstream.items()
        for model_id, model in (provider.get("models") or {}).items()
        if model.get("status") == "deprecated"
    }
    original_count = len(snapshot["models"])
    snapshot["models"] = [
        row for row in snapshot["models"] if row["id"] not in inactive_ids
    ]
    hidden = original_count - len(snapshot["models"])
    existing = {row["id"] for row in snapshot["models"]}
    updated = added = 0
    for provider_id in sorted(DIRECT_PROVIDERS):
        provider = upstream.get(provider_id) or {}
        models = provider.get("models") or {}
        for row in snapshot["models"]:
            prefix, _, model_id = row["id"].partition("/")
            if prefix != provider_id or row["category"] not in {"Text/chat", "Multimodal chat", "chat"}:
                continue
            if PROVIDER_NAMES.get(row["provider"].casefold(), row["provider"].casefold()) != provider_id:
                continue
            source = row.get("source") or ""
            missing = row["inputPrice"] is None and row["outputPrice"] is None
            managed = row.get("basis") == "Models.dev · direct provider base text rates"
            if row.get("documentedRate") or not (managed or (missing and source.startswith("https://models.dev/"))):
                continue
            model = models.get(model_id) or {}
            rates = token_rates(model)
            if rates is None or model.get("status") == "deprecated":
                continue
            row["inputPrice"], row["outputPrice"] = rates
            row["basis"] = "Models.dev · direct provider base text rates"
            row["source"] = model_source(provider_id, model_id)
            updated += 1
        for model_id, model in sorted(models.items()):
            key = f"{provider_id}/{model_id}"
            modalities = model.get("modalities") or {}
            rates = token_rates(model)
            if key in inactive_ids or key in existing or model_id in existing or rates is None or model.get("type"):
                continue
            if "text" not in (modalities.get("input") or []) or modalities.get("output") != ["text"]:
                continue
            name = model.get("name")
            if not isinstance(name, str) or not name.strip():
                continue
            category = "Multimodal chat" if set(modalities["input"]) - {"text"} else "Text/chat"
            snapshot["models"].append({
                "id": key, "name": name, "provider": provider.get("name") or provider_id,
                "category": category, "inputPrice": rates[0], "outputPrice": rates[1],
                "useCase": "Text generation with " + ", ".join(modalities["input"]) + " input",
                "domain": "", "parameters": None, "isNew": True,
                "basis": "Models.dev · direct provider base text rates",
                "source": model_source(provider_id, model_id),
            })
            existing.add(key)
            added += 1
    return updated, added, hidden


def model_source(provider, model):
    return f"https://models.dev/providers/{provider}/models/{quote(model, safe='')}/"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path)
    parser.add_argument("--fixture", type=Path, help="Use a local Models.dev response for testing")
    args = parser.parse_args()
    if args.fixture:
        upstream = json.loads(args.fixture.read_text(encoding="utf-8"))
    else:
        request = Request(API_URL, headers={"User-Agent": "TokenROICalculator catalog refresh"})
        with urlopen(request, timeout=45) as response:
            upstream = json.load(response)
    if not isinstance(upstream, dict) or not all(
        isinstance(upstream.get(key, {}).get("models"), dict) and upstream[key]["models"]
        for key in DIRECT_PROVIDERS
    ):
        raise ValueError("Models.dev response is missing supported provider data")

    calculator = args.site / "calculator.py"
    source = calculator.read_text(encoding="utf-8")
    before, payload = source.split(START, 1)
    catalog, after = payload.split(END, 1)
    snapshot = json.loads(catalog)
    updated, added, hidden = refresh(snapshot, upstream, retired_model_ids(source))
    # Escape apostrophes so upstream text cannot close the embedded raw string.
    payload = json.dumps(snapshot, ensure_ascii=True, separators=(",", ":")).replace("'", r"\u0027")
    generated = before + START + payload + END + after
    compile(generated, str(calculator), "exec")
    calculator.write_text(generated, encoding="utf-8")
    index = args.site / "index.html"
    html = index.read_text(encoding="utf-8")
    revision = sha256(generated.encode("utf-8")).hexdigest()[:16]
    html = html.replace('./calculator.py"', f'./calculator.py?v={revision}"')
    index.write_text(html.replace("Catalog snapshot: 11 November 2026.", f"Catalog refreshed: {date.today().isoformat()} (UTC)."), encoding="utf-8")
    print(f"Applied {updated} rate pairs and added {added} listings. Hid {hidden} inactive listings. Total entries: {len(snapshot['models'])}.")


if __name__ == "__main__":
    main()
