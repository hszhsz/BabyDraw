import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    """
    测试根路径
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "BabyDraw" in data["message"]

def test_health_check():
    """
    测试健康检查
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

def test_api_docs():
    """
    测试API文档可访问性
    """
    response = client.get("/docs")
    assert response.status_code == 200

def test_openapi_json():
    """
    测试OpenAPI JSON
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "info" in data