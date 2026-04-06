from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Path to .env
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

def test_connection():
    print(f"Testing connection to: {DATABASE_URL}")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Success! Connection verified. Result: {result.fetchone()}")
            
            # Check for tables
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"Tables in DB: {tables}")
            
    except Exception as e:
        print(f"Connection failed: {str(e).encode('ascii', 'ignore').decode()}")

if __name__ == "__main__":
    test_connection()
