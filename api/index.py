import sys
import os

# Add the project root to sys.path to allow absolute imports of the backend package
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Import the FastAPI app from the backend package
from backend.app.main import app

# Vercel needs the app object to be available at the module level
# By default, it looks for an object named 'app'
