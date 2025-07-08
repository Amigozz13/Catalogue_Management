import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from api import app
from service.catalogue_service import CatalogueService

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_get_catalogues(client):
    response = client.get('/catalogues')
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

def test_create_catalogue(client):
    data = {
        "name": "Test",
        "effective_from": "2025-07-01",
        "effective_to": "2025-07-31",
        "status": "Active"
    }
    response = client.post('/catalogues', json=data)
    assert response.status_code in (200, 201)
    assert "message" in response.get_json()

    cat = CatalogueService.create_catalogue({
        "name": "Test",
        "effective_from": "2025-07-01",
        "effective_to": "2025-07-31",
        "status": "Active"
    })