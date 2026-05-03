import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def wipe():
    try:
        client = AsyncIOMotorClient('mongodb+srv://bitf22m522_db_user:lNqbb1dWSGBHZGMg@cluster0.hvwark1.mongodb.net/', serverSelectionTimeoutMS=5000)
        db = client['LMS']
        result = await db['aiGeneratedLessons'].delete_many({})
        print(f'SUCCESS: Deleted {result.deleted_count} cached AI lessons!')
    except Exception as e:
        print(f'ERROR: {e}')

asyncio.run(wipe())
