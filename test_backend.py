from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.append(r"c:\Users\manah\OneDrive\Desktop\New folder\backend\EduVerse-AI-backend")

from app.main import app
from app.auth.dependencies import get_current_user

# Override auth dependency
def mock_get_current_user():
    return {
        "user_id": "000000000000000000000000",
        "role": "teacher",
        "tenant_id": "test_tenant",
        "teacher_id": "111111111111111111111111"
    }

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

import urllib.request

def ensure_pdf():
    pdf_path = "test_reference.pdf"
    if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) < 1000:
        print("Downloading a valid sample PDF...")
        url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        urllib.request.urlretrieve(url, pdf_path)

def test_lesson_description():
    ensure_pdf()
    # ── TEST 1: Upload a reference file first ──────────────────────────────
    print("\n--- TEST 1: Upload Reference File ---")

    with open("test_reference.pdf", "rb") as f:
        upload_response = client.post(
            "/reference/upload",
            files={"file": ("test_reference.pdf", f, "application/pdf")},
            data={
                "tenant_id": "test_tenant",
                "course_id": "test_course",
                "lesson_id": "test_lesson",
                "scope":     "lesson"
            }
        )

    print(f"Upload status: {upload_response.status_code}")
    print(f"Upload response: {upload_response.json()}")
    assert upload_response.status_code == 200
    assert upload_response.json()["status"] == "processed"
    print("TEST 1: PASSED ✅")

    # ── TEST 2: Generate description WITHOUT upload_id ─────────────────────
    print("\n--- TEST 2: Generate Description (no upload_id) ---")

    desc_response = client.post(
        "/reference/generate-description",
        json={
            "topic":     "Newton's Laws",
            "tenant_id": "test_tenant",
            "course_id": "test_course",
            "lesson_id": "test_lesson"
        }
    )

    print(f"Description status: {desc_response.status_code}")
    result = desc_response.json()
    print(f"Description response: {result}")

    assert desc_response.status_code == 200
    assert result["status"] == "success"
    assert "lesson_description" in result
    assert result["lesson_description"].get("lesson_title")
    assert isinstance(result["lesson_description"].get("learning_objectives"), list)
    print("TEST 2: PASSED ✅")

    # ── TEST 3: Generate when NO reference exists ──────────────────────────
    print("\n--- TEST 3: Generate with no reference (should return error) ---")

    no_ref_response = client.post(
        "/reference/generate-description",
        json={
            "topic":     "Quantum Physics",
            "tenant_id": "nonexistent_tenant",
            "course_id": "nonexistent_course",
            "lesson_id": "nonexistent_lesson"
        }
    )

    result3 = no_ref_response.json()
    print(f"No-ref response: {result3}")
    assert result3["status"] == "error"
    assert "upload" in result3["message"].lower()
    print("TEST 3: PASSED ✅")

    print("\n=== ALL TESTS PASSED ✅ ===")

if __name__ == "__main__":
    test_lesson_description()
