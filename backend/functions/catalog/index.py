"""
Catalog Lambda — Query AI model catalog from DynamoDB
Supports: list all (no 500 limit cap, scans until complete), filter by category/provider/search, get by ID
"""
import json
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

TABLE_NAME = os.environ["TABLE_NAME"]
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
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

def handler(event, context):
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    path_params = event.get("pathParameters") or {}

    if method == "OPTIONS":
        return respond(200, {})

    if path_params.get("modelId"):
        model_id = path_params["modelId"]
        result = table.get_item(Key={"modelId": model_id})
        item = result.get("Item")
        if not item:
            return respond(404, {"error": "Model not found"})
        return respond(200, item)

    category = params.get("category")
    provider = params.get("provider")
    search = params.get("q", "").lower().strip()
    limit_str = params.get("limit")
    offset = int(params.get("offset", "0"))

    # Scan entire table handling DynamoDB pagination to fetch all 800+ models
    items = []
    scan_kwargs = {}
    done = False
    start_key = None
    while not done:
        if start_key:
            scan_kwargs["ExclusiveStartKey"] = start_key
        response = table.scan(**scan_kwargs)
        items.extend(response.get("Items", []))
        start_key = response.get("LastEvaluatedKey")
        done = start_key is None

    # In-memory filter
    if category:
        items = [m for m in items if m.get("category","").lower() == category.lower()]
    if provider:
        items = [m for m in items if m.get("provider","").lower() == provider.lower()]
    if search:
        items = [
            m for m in items
            if (
                search in m.get("name","").lower()
                or search in m.get("provider","").lower()
                or search in m.get("modelId","").lower()
                or search in m.get("category","").lower()
                or search in m.get("useCase","").lower()
                or search in m.get("accuracy","").lower()
            )
        ]

    # Default sort by Model Name alphabetical (A-Z)
    items.sort(key=lambda m: str(m.get("name", "")).lower())

    total = len(items)

    all_categories = sorted(set(m.get("category","") for m in items if m.get("category")))
    all_providers = sorted(set(m.get("provider","") for m in items if m.get("provider")))

    if limit_str:
        try:
            page_limit = int(limit_str)
            page = items[offset : offset + page_limit]
        except ValueError:
            page = items[offset:]
    else:
        page = items[offset:]

    return respond(200, {
        "models": page,
        "total": total,
        "offset": offset,
        "limit": len(page),
        "categories": all_categories,
        "providers": all_providers,
    })
