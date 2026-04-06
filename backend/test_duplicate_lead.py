import requests

BASE_URL = "http://localhost:8000/api/leads"

def test_duplicate_lead():
    # Use the same email from the previous success
    email = "test_077ebb@example.com" 
    data = {
        "first_name": "Duplicate",
        "last_name": "Test",
        "email": email,
        "company": "Duplicate Co",
        "status": "new",
        "source": "manual"
    }
    
    print(f"Attempting to create DUPLICATE lead with email: {email}")
    try:
        response = requests.post(BASE_URL, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 500:
             print("BINGO! Backend crashed with 500 error on duplicate email.")
        elif response.status_code == 400:
             print("Backend correctly handled as 400 BAD REQUEST.")
        else:
             print(f"Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_duplicate_lead()
