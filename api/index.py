"""Vercel Serverless Function entrypoint for Curavex Clinical MLOps Backend."""
import os
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from src.api.main import app

# Vercel entrypoint
app = app
