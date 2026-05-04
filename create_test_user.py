import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
# we need to be able to import app.utils.security
sys.path.append(r"c:\Users\manah\OneDrive\Desktop\New folder\backend\EduVerse-AI-backend")

from app.utils.security import hash_password
from bson import ObjectId

async def create_test_teacher():
    uri = "mongodb+srv://bitf22m522_db_user:lNqbb1dWSGBHZGMg@cluster0.hvwark1.mongodb.net/"
    client = AsyncIOMotorClient(uri)
    db = client["LMS"]
    
    # Check if exists
    user = await db.users.find_one({"email": "test_teacher_rag@example.com"})
    if not user:
        user_id = ObjectId()
        await db.users.insert_one({
            "_id": user_id,
            "fullName": "Test Teacher",
            "email": "test_teacher_rag@example.com",
            "password": hash_password("password123"),
            "role": "teacher",
            "status": "active"
        })
        print("Created test teacher in DB.")
    else:
        # Update password just in case
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hash_password("password123")}}
        )
        print("Updated test teacher in DB.")

if __name__ == "__main__":
    asyncio.run(create_test_teacher())
