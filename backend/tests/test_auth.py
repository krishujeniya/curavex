"""Tests for user authentication endpoints."""
from fastapi.testclient import TestClient

from src.api.main import app


def test_signup_signin_me_and_signout():
    with TestClient(app) as client:
        # 1. Sign up
        res = client.post(
            "/api/v1/auth/signup",
            json={
                "name": "Dr. Maya Lin",
                "email": "maya@curavex.ai",
                "password": "StrongPassword123",
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "maya@curavex.ai"
        token = data["access_token"]

        # 2. Duplicate email returns 409
        dup = client.post(
            "/api/v1/auth/signup",
            json={
                "name": "Maya Duplicate",
                "email": "maya@curavex.ai",
                "password": "StrongPassword123",
            },
        )
        assert dup.status_code == 409

        # 3. Sign in with valid credentials
        signin = client.post(
            "/api/v1/auth/signin",
            json={"email": "maya@curavex.ai", "password": "StrongPassword123"},
        )
        assert signin.status_code == 200
        assert signin.json()["user"]["name"] == "Dr. Maya Lin"

        # 4. Invalid password returns 401
        bad = client.post(
            "/api/v1/auth/signin",
            json={"email": "maya@curavex.ai", "password": "WrongPassword"},
        )
        assert bad.status_code == 401

        # 5. /me with valid token
        me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == "maya@curavex.ai"

        # 6. /me without token returns 401
        unauth = client.get("/api/v1/auth/me")
        assert unauth.status_code == 401

        # 7. Sign out revokes token
        out = client.post("/api/v1/auth/signout", headers={"Authorization": f"Bearer {token}"})
        assert out.status_code == 200
        me_after = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_after.status_code == 401
