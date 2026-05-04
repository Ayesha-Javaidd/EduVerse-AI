import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_config():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["eduverse"]
    config = db["config"]
    doc = await config.find_one({"_id": "active_worker_model"})
    print(f"RESULT:{json.dumps(doc, default=str)}")

if __name__ == "__main__":
    asyncio.run(check_config())
