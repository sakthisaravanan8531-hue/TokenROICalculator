"""
Daily Catalog Refresher Lambda
Runs daily via EventBridge cron to refresh, update, and enrich model details and pricing in DynamoDB.
Extracts the live 700+ model definitions directly from calculator.py in the repository or seeds from the curated list.
"""
import json
import os
import re
import boto3
import urllib.request
from decimal import Decimal

TABLE_NAME = os.environ["TABLE_NAME"]
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

SOURCE_URL = os.environ.get(
    "CATALOG_SOURCE_URL",
    "https://raw.githubusercontent.com/sakthisaravanan8531-hue/TokenROICalculator/main/docs/calculator.py"
)

def handler(event, context):
    print("Starting daily catalog refresh...")
    updated_count = 0
    try:
        req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "TokenROIRefresher/2.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8")
            
        m = re.search(r"CATALOG\s*=\s*r'''(.*?)'''", text, re.DOTALL)
        if not m:
            m = re.search(r'CATALOG\s*=\s*r"""(.*?)"""', text, re.DOTALL)
            
        if not m:
            print("Could not match CATALOG raw string pattern. Retaining existing DynamoDB items.")
            return {"status": "skipped", "reason": "pattern_not_found"}
            
        catalog_json = m.group(1).strip()
        data = json.loads(catalog_json)
        models = data.get("models", [])
        print(f"Extracted {len(models)} models from calculator.py source.")
        
        with table.batch_writer() as batch:
            for item in models:
                mid = item.get("id") or item.get("modelId")
                name = item.get("name")
                if not mid or not name:
                    continue
                    
                entry = {
                    "modelId": str(mid),
                    "name": str(name),
                    "provider": str(item.get("provider", "Unknown")),
                    "category": str(item.get("category", "General")),
                    "inputPrice": Decimal(str(item.get("inputPrice", 0) or 0)),
                    "outputPrice": Decimal(str(item.get("outputPrice", 0) or 0)),
                    "accuracy": str(item.get("accuracy", "Standard")),
                    "useCase": str(item.get("useCase", "") or ""),
                    "basis": str(item.get("basis", "per 1M tokens") or ""),
                    "source": str(item.get("source", "") or ""),
                    "parameters": str(item.get("parameters", "Unknown") or ""),
                    "isNew": bool(item.get("isNew", False)),
                    "lastRefreshed": "daily-cron"
                }
                batch.put_item(Item=entry)
                updated_count += 1
                
        print(f"Daily refresh complete. Successfully updated {updated_count} models in DynamoDB.")
        return {"status": "success", "modelsUpdated": updated_count}
        
    except Exception as e:
        print(f"Error during daily refresh: {e}")
        return {"status": "error", "error": str(e)}
