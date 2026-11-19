"""
Seed DynamoDB with the full AI Model Catalog
Run: python seed_dynamodb.py --table AIModelCatalog-prod --region ap-south-1
"""
import argparse
import boto3
import json
from decimal import Decimal

MODELS = [
    # ── Frontier Reasoning ──────────────────────────────────────────────────
    {"modelId":"claude-fable-5-2","name":"Claude Fable 5.2","provider":"Anthropic","category":"Frontier Reasoning","inputPrice":Decimal("8.00"),"outputPrice":Decimal("40.00"),"accuracy":"Frontier SOTA (96–98%)","useCase":"Overall intelligence leader for deep reasoning, complex research, and multi-step autonomous agents.","basis":"per 1M tokens","source":"https://platform.claude.com/docs/en/models/fable-5-2/overview","parameters":"Unknown","isNew":True},
    {"modelId":"claude-fable-5-1","name":"Claude Fable 5.1","provider":"Anthropic","category":"Frontier Reasoning","inputPrice":Decimal("10.00"),"outputPrice":Decimal("50.00"),"accuracy":"Frontier SOTA (94–96%)","useCase":"Heavy agentic workloads, deep research, and nuanced long-form synthesis.","basis":"per 1M tokens","source":"https://platform.claude.com/docs/en/models/overview","parameters":"Unknown","isNew":False},
    {"modelId":"gpt-6-astra","name":"GPT-6 Astra","provider":"OpenAI","category":"Frontier Reasoning","inputPrice":Decimal("10.00"),"outputPrice":Decimal("50.00"),"accuracy":"Frontier SOTA (95–97%)","useCase":"Frontier reasoning, advanced cybersecurity research, and multi-step autonomous problem solving.","basis":"per 1M tokens","source":"https://developers.openai.com/api/docs/models/gpt-6-astra","parameters":"Unknown","isNew":True},
    {"modelId":"gemini-4-carbon","name":"Gemini 4 Carbon","provider":"Google","category":"Frontier Reasoning","inputPrice":Decimal("2.00"),"outputPrice":Decimal("10.00"),"accuracy":"Frontier SOTA (94–96%)","useCase":"High-reasoning flagship tasks, multimodal analysis, and complex scientific/code synthesis.","basis":"per 1M tokens","source":"https://aistudio.google.com/docs/whats-new-gemini-4-carbon","parameters":"Unknown","isNew":True},
    {"modelId":"grok-4-7","name":"Grok 4.7","provider":"xAI","category":"Frontier Reasoning","inputPrice":Decimal("2.00"),"outputPrice":Decimal("6.00"),"accuracy":"Near-Frontier High (89–92%)","useCase":"Real-time social/web data synthesis, fast reasoning, and conversational agents.","basis":"per 1M tokens","source":"https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-xai-grok-4-7.html","parameters":"Unknown","isNew":True},
    {"modelId":"mistral-large-4","name":"Mistral Large 4","provider":"Mistral AI","category":"Frontier Reasoning","inputPrice":Decimal("1.36"),"outputPrice":Decimal("4.18"),"accuracy":"High Enterprise (87–90%)","useCase":"European data-sovereign deployments, multilingual reasoning, and enterprise RAG.","basis":"per 1M tokens","source":"https://huggingface.co/blog/mistral-large4","parameters":"Unknown","isNew":False},

    # ── Coding & Agents ─────────────────────────────────────────────────────
    {"modelId":"claude-opus-5-5","name":"Claude Opus 5.5","provider":"Anthropic","category":"Coding & Agents","inputPrice":Decimal("4.00"),"outputPrice":Decimal("20.00"),"accuracy":"Frontier Coding SOTA (94–96%)","useCase":"Long-running software development, complex code refactoring, and enterprise knowledge work.","basis":"per 1M tokens","source":"https://www.anthropic.com/claude-opus-5-5","parameters":"Unknown","isNew":True},
    {"modelId":"claude-sonnet-5-5","name":"Claude Sonnet 5.5","provider":"Anthropic","category":"Coding & Agents","inputPrice":Decimal("2.00"),"outputPrice":Decimal("10.00"),"accuracy":"High Production Coding (90–93%)","useCase":"Balanced speed-to-intelligence ratio for daily coding, technical writing, and sub-agent orchestration.","basis":"per 1M tokens","source":"https://www.anthropic.com/claude-sonnet-5-5","parameters":"Unknown","isNew":True},
    {"modelId":"gpt-6-1-sol","name":"GPT-6.1 Sol","provider":"OpenAI","category":"Coding & Agents","inputPrice":Decimal("2.00"),"outputPrice":Decimal("10.00"),"accuracy":"Frontier Coding SOTA (93–95%)","useCase":"Complex software engineering, agentic tool execution, and automated workflows.","basis":"per 1M tokens","source":"https://developers.openai.com/api/docs/guides/latest-model","parameters":"Unknown","isNew":True},
    {"modelId":"deepseek-v4-pro","name":"DeepSeek V4 Pro","provider":"DeepSeek","category":"Coding & Agents","inputPrice":Decimal("1.32"),"outputPrice":Decimal("3.96"),"accuracy":"Open-Weight Coding SOTA (91–94%)","useCase":"Mathematics, algorithmic coding, and massive single-pass output generation.","basis":"per 1M tokens","source":"https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro","parameters":"1.6T total / 49B active MoE","isNew":True},

    # ── Budget & Fast ────────────────────────────────────────────────────────
    {"modelId":"gpt-6-1-terra","name":"GPT-6.1 Terra","provider":"OpenAI","category":"Budget & Fast","inputPrice":Decimal("1.50"),"outputPrice":Decimal("7.50"),"accuracy":"High Fast-Tier (87–90%)","useCase":"Low-latency reasoning and fast task execution where turnaround speed matters most.","basis":"per 1M tokens","source":"https://developers.openai.com/api/docs/guides/latest-model","parameters":"Unknown","isNew":False},
    {"modelId":"gemini-4-hydrogen","name":"Gemini 4 Hydrogen","provider":"Google","category":"Budget & Fast","inputPrice":Decimal("1.50"),"outputPrice":Decimal("7.50"),"accuracy":"High Fast-Tier (86–89%)","useCase":"Fast everyday productivity, coding, search grounding, and document preparation.","basis":"per 1M tokens","source":"https://aistudio.google.com/docs","parameters":"Unknown","isNew":True},
    {"modelId":"gemini-3-8-flash","name":"Gemini 3.8 Flash","provider":"Google","category":"Budget & Fast","inputPrice":Decimal("0.75"),"outputPrice":Decimal("3.75"),"accuracy":"High Speed/Accuracy (85–88%)","useCase":"High-speed production apps, real-time multimodal tasks, and cost-effective scaling.","basis":"per 1M tokens","source":"https://aistudio.google.com/docs","parameters":"Unknown","isNew":False},
    {"modelId":"gpt-6-luna","name":"GPT-6 Luna","provider":"OpenAI","category":"Budget & Fast","inputPrice":Decimal("0.10"),"outputPrice":Decimal("0.50"),"accuracy":"Moderate-High Lightweight (79–83%)","useCase":"Large-scale data extraction, bulk summarization, and ultra-low-cost high-throughput tasks.","basis":"per 1M tokens","source":"https://developers.openai.com/api/docs/models/all","parameters":"Unknown","isNew":False},
    {"modelId":"claude-haiku-5-5","name":"Claude Haiku 5.5","provider":"Anthropic","category":"Budget & Fast","inputPrice":Decimal("0.10"),"outputPrice":Decimal("0.50"),"accuracy":"High Fast-Tier (83–86%)","useCase":"Instantaneous customer support, rapid tagging, and low-latency UI interactions.","basis":"per 1M tokens","source":"https://platform.claude.com/docs/en/models/overview","parameters":"Unknown","isNew":True},
    {"modelId":"hunyuan-hy4-flash","name":"Hunyuan Hy4 Flash","provider":"Tencent","category":"Budget & Fast","inputPrice":Decimal("0.04"),"outputPrice":Decimal("0.18"),"accuracy":"Moderate-High Efficient (80–84%)","useCase":"Ultra-cheap, high-volume routine automation, document/chart comprehension, and agent pipelines.","basis":"per 1M tokens","source":"https://huggingface.co/tencent/Hy4-preview","parameters":"Unknown","isNew":True},

    # ── Local, Edge & Long-Context ───────────────────────────────────────────
    {"modelId":"llama-4-scout","name":"Llama 4 Scout","provider":"Meta","category":"Local, Edge & Long-Context","inputPrice":Decimal("0.02"),"outputPrice":Decimal("0.08"),"accuracy":"High Long-Context (85–88%)","useCase":"Ultra-long-context retrieval across entire codebases or massive document archives on a single GPU.","basis":"per 1M tokens (hosted)","source":"https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E","parameters":"109B MoE / 17B active","isNew":True},
    {"modelId":"gemma-4-27b","name":"Gemma 4 (12B/27B/31B)","provider":"Google","category":"Local, Edge & Long-Context","inputPrice":Decimal("0.03"),"outputPrice":Decimal("0.12"),"accuracy":"Solid Edge Multimodal (80–85%)","useCase":"Lightweight local deployment, edge devices, and compact multimodal tasks.","basis":"per 1M tokens (hosted)","source":"https://huggingface.co/blog/gemma4","parameters":"12B–31B","isNew":True},

    # ── Medical & Healthcare ─────────────────────────────────────────────────
    {"modelId":"medgemma-1-5-27b","name":"MedGemma 1.5 (4B/27B)","provider":"Google","category":"Medical & Healthcare","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Open Medical SOTA (~91% MedQA)","useCase":"Leads open medical models; reads 3D CT/MRI volumes, pathology slides, and EHR/FHIR records.","basis":"self-hosted","source":"https://huggingface.co/collections/google/medgemma-release-680aade845f90bec6a3f60c4","parameters":"4B / 27B","isNew":True},
    {"modelId":"evidencemd-60b","name":"EvidenceMD (60B)","provider":"EvidenceMD","category":"Medical & Healthcare","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Clinical System SOTA (54.6% HealthBench Hard)","useCase":"#1 clinical system on HealthBench Hard; retrieval over 40M+ medical papers with inline citations.","basis":"enterprise plans","source":"https://evidencemd.ai","parameters":"60B","isNew":True},
    {"modelId":"alphafold-3","name":"AlphaFold 3 / Boltz-2","provider":"Google DeepMind","category":"Medical & Drug Discovery","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Structural Bio SOTA (>85% DockQ)","useCase":"Atomic-level prediction of protein-ligand, DNA, RNA, and small-molecule binding for drug discovery.","basis":"free server / self-hosted","source":"https://github.com/google-deepmind/alphafold3","parameters":"Unknown","isNew":False},

    # ── Banking & Finance ────────────────────────────────────────────────────
    {"modelId":"fin-gpt","name":"FinGPT (Llama3/InternLM LoRAs)","provider":"AI4Finance","category":"Banking & Finance","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Specialized FinTech (82–86%)","useCase":"Financial sentiment analysis, SEC filing extraction, stock forecasting, and robo-advisor fine-tuning.","basis":"self-hosted","source":"https://huggingface.co/FinGPT","parameters":"7B–70B LoRA","isNew":False},
    {"modelId":"bloomberggpt","name":"BloombergGPT","provider":"Bloomberg","category":"Banking & Finance","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Institutional Finance SOTA (86–90% FinNLP)","useCase":"Institutional financial NLP, earnings call parsing, ticker/entity recognition, and Bloomberg query generation.","basis":"Bloomberg Terminal (~$24K+/yr)","source":"https://www.bloomberg.com/company/press/bloomberggpt-50-billion-parameter-llm-tuned-finance/","parameters":"50B","isNew":False},

    # ── Enterprise & RAG ────────────────────────────────────────────────────
    {"modelId":"command-a","name":"Command A / A+","provider":"Cohere","category":"Enterprise Services & RAG","inputPrice":Decimal("2.50"),"outputPrice":Decimal("10.00"),"accuracy":"Enterprise RAG SOTA (92–95%)","useCase":"Enterprise RAG, grounded citations, and multilingual customer service workflows.","basis":"per 1M tokens","source":"https://huggingface.co/CohereLabs/c4ai-command-a-03-2025","parameters":"111B","isNew":False},
    {"modelId":"ibm-granite-3-3","name":"IBM Granite 3.3 / 4.2","provider":"IBM","category":"Enterprise Services & RAG","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"High Enterprise Guardrail (85–89%)","useCase":"Customer support, banking onboarding, and RAG hallucination detection / citation LoRA adapters.","basis":"self-hosted / watsonx API","source":"https://huggingface.co/collections/ibm-granite/granite-33","parameters":"2B / 8B","isNew":False},

    # ── Image Generation ────────────────────────────────────────────────────
    {"modelId":"gpt-image-2-5","name":"GPT Image 2 / 2.5 Flare","provider":"OpenAI","category":"Image Gen & Editing","inputPrice":Decimal("30.00"),"outputPrice":Decimal("30.00"),"accuracy":"Image Gen SOTA (#1 Image Arena)","useCase":"#1 image leaderboard quality; precise typography, complex layout design, and conversational image editing.","basis":"per 1M output tokens","source":"https://platform.openai.com/docs/guides/image-generation","parameters":"Unknown","isNew":True},
    {"modelId":"flux-2-pro","name":"FLUX.2 [pro/dev/klein]","provider":"Black Forest Labs","category":"Image Gen & Editing","inputPrice":Decimal("0.014"),"outputPrice":Decimal("0.014"),"accuracy":"Open Image SOTA (Top-3 Image Arena)","useCase":"Industry standard for open-weights photorealism, LoRA fine-tuning, and context-preserving image editing.","basis":"per MP","source":"https://huggingface.co/black-forest-labs","parameters":"Unknown","isNew":True},
    {"modelId":"midjourney-v8-1","name":"Midjourney V8.1","provider":"Midjourney","category":"Image Gen & Editing","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Artistic Aesthetic SOTA (Top-3 Visual Preference)","useCase":"Industry benchmark for artistic aesthetics, editorial illustration, concept art, and stylistic coherence.","basis":"$10–$120/month","source":"https://docs.midjourney.com/","parameters":"Unknown","isNew":True},

    # ── Video Generation ────────────────────────────────────────────────────
    {"modelId":"google-veo-3-1","name":"Google Veo 3.1","provider":"Google","category":"Video Generation","inputPrice":Decimal("0.35"),"outputPrice":Decimal("0.35"),"accuracy":"Video Gen SOTA (#1 EvalCrafter)","useCase":"4K commercial video ads with synced 48kHz audio, film pre-visualization, D2C product reels.","basis":"per second","source":"https://deepmind.google/technologies/veo/","parameters":"Unknown","isNew":True},
    {"modelId":"runway-gen-4","name":"Runway Gen-4 / Turbo","provider":"Runway","category":"Video Generation","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"High Controllable Video (Top-3)","useCase":"Film VFX shot generation, camera-path-controlled commercial pre-viz, music videos.","basis":"subscription / credits","source":"https://runwayml.com","parameters":"Unknown","isNew":False},

    # ── Audio & Speech ───────────────────────────────────────────────────────
    {"modelId":"elevenlabs-flash-v2-5","name":"ElevenLabs Flash v2.5","provider":"ElevenLabs","category":"Audio, Speech & Music","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Ultra-Low Latency TTS SOTA (<75ms)","useCase":"Autonomous inbound/outbound voice bots, emotion-preserved OTT movie dubbing, audiobooks.","basis":"$0.0003/char (Starter)","source":"https://elevenlabs.io","parameters":"Unknown","isNew":True},
    {"modelId":"nova-3-medical","name":"Nova-3 Medical","provider":"Deepgram","category":"Medical & Healthcare","inputPrice":Decimal("0.00"),"outputPrice":Decimal("0.00"),"accuracy":"Medical ASR SOTA (96.56% / 3.44% WER)","useCase":"Clinical transcription with 3.44% WER across specialized medical terminology, drug names, and EHR dictation.","basis":"$0.0052/min batch","source":"https://deepgram.com/product/medical-transcription","parameters":"Unknown","isNew":True},

    # ── Embeddings & Reranking ────────────────────────────────────────────────
    {"modelId":"text-embedding-3-large","name":"OpenAI text-embedding-3-large","provider":"OpenAI","category":"Embeddings & Search","inputPrice":Decimal("0.13"),"outputPrice":Decimal("0.00"),"accuracy":"Top Embedding (MTEB #2)","useCase":"High-precision vector search, RAG indexing, semantic similarity, and recommendation systems.","basis":"per 1M tokens","source":"https://platform.openai.com/docs/guides/embeddings","parameters":"256–3072 dims","isNew":False},
    {"modelId":"cohere-embed-v4","name":"Cohere Embed v4","provider":"Cohere","category":"Embeddings & Search","inputPrice":Decimal("0.10"),"outputPrice":Decimal("0.00"),"accuracy":"Enterprise Embedding SOTA (MTEB #1 multilingual)","useCase":"High-precision enterprise RAG search, semantic e-commerce product discovery, financial search.","basis":"per 1M tokens","source":"https://cohere.com/blog/cohere-embed-v4","parameters":"1024 dims","isNew":True},

    # ── Amazon Bedrock Native ─────────────────────────────────────────────────
    {"modelId":"amazon-nova-lite","name":"Amazon Nova Lite","provider":"Amazon","category":"Budget & Fast","inputPrice":Decimal("0.06"),"outputPrice":Decimal("0.24"),"accuracy":"High Efficient (83–87%)","useCase":"Low-cost multimodal understanding, document/image QA, fast structured output for high-volume pipelines.","basis":"per 1M tokens","source":"https://aws.amazon.com/bedrock/nova/","parameters":"Unknown","isNew":True},
    {"modelId":"amazon-nova-pro","name":"Amazon Nova Pro","provider":"Amazon","category":"Frontier Reasoning","inputPrice":Decimal("0.80"),"outputPrice":Decimal("3.20"),"accuracy":"Solid Enterprise (83–87%)","useCase":"Tightly integrated AWS cloud pipelines, video/document understanding, and enterprise agent orchestration.","basis":"per 1M tokens","source":"https://aws.amazon.com/bedrock/nova/","parameters":"Unknown","isNew":True},
    {"modelId":"amazon-nova-micro","name":"Amazon Nova Micro","provider":"Amazon","category":"Budget & Fast","inputPrice":Decimal("0.035"),"outputPrice":Decimal("0.14"),"accuracy":"Moderate Efficient (78–82%)","useCase":"Ultra-cheap text-only tasks: classification, extraction, routing, summarization at massive scale.","basis":"per 1M tokens","source":"https://aws.amazon.com/bedrock/nova/","parameters":"Unknown","isNew":True},
    {"modelId":"amazon-titan-text-express","name":"Amazon Titan Text Express","provider":"Amazon","category":"Budget & Fast","inputPrice":Decimal("0.20"),"outputPrice":Decimal("0.60"),"accuracy":"Moderate (75–80%)","useCase":"General enterprise text generation, summarization, and Q&A within AWS-native workflows.","basis":"per 1M tokens","source":"https://aws.amazon.com/bedrock/titan/","parameters":"Unknown","isNew":False},
    {"modelId":"amazon-titan-embed-v2","name":"Amazon Titan Embed Text v2","provider":"Amazon","category":"Embeddings & Search","inputPrice":Decimal("0.02"),"outputPrice":Decimal("0.00"),"accuracy":"Good Enterprise Embedding","useCase":"Cost-effective RAG and semantic search within AWS ecosystem.","basis":"per 1M tokens","source":"https://aws.amazon.com/bedrock/titan/","parameters":"256/512/1024 dims","isNew":False},
]


def seed(table_name, region):
    dynamodb = boto3.resource("dynamodb", region_name=region)
    table = dynamodb.Table(table_name)

    print(f"Seeding {len(MODELS)} models into {table_name} ({region})...")

    # BatchWrite in chunks of 25
    with table.batch_writer() as batch:
        for i, model in enumerate(MODELS):
            # Convert 0.00 Decimal to proper Decimal for DynamoDB
            item = {k: (Decimal(str(v)) if isinstance(v, float) else v) for k, v in model.items()}
            batch.put_item(Item=item)
            if (i + 1) % 25 == 0:
                print(f"  {i+1}/{len(MODELS)} written...")

    print(f"✓ Seeded {len(MODELS)} models successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--table",  default="AIModelCatalog-prod")
    parser.add_argument("--region", default="ap-south-1")
    args = parser.parse_args()
    seed(args.table, args.region)
