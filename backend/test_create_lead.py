import requests
import uuid

BASE_URL = "http://localhost:8000/api/leads"

def test_create_lead():
    # Random email to avoid unique constraint for first test
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    data = {
        "first_name": "Test",
        "last_name": "Lead",
        "email": email,
        "company": "Test Co",
        "status": "new",
        "source": "manual"
    }
    
    print(f"Attempting to create lead with email: {email}")
    try:
        response = requests.post(BASE_URL, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("Successfully created lead in DB.")
        else:
            print("Failed to create lead.")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Note: Backend must be running for this to work.
    # If backend is NOT running, this will fail with connection error.
    test_create_lead()
