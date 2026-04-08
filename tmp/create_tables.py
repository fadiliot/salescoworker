import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.database import engine, Base
from app.models.agent import AgentLog, AgentConfig, ApprovalQueue

print("Creating Agentic Workflow tables...")
Base.metadata.create_all(bind=engine, tables=[
    AgentLog.__table__,
    AgentConfig.__table__,
    ApprovalQueue.__table__
])
print("Tables created successfully.")
