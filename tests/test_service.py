import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import random
import string
import pytest
from service.catalogue_service import CatalogueService
from service.auth_service import AuthService
from dto.catalogue import Catalogue

@pytest.fixture
def catalogue_service():
    return CatalogueService()

@pytest.fixture
def auth_service():
    return AuthService()

def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def test_create_and_get_catalogue(catalogue_service):
    cat_obj = Catalogue(
        id=None,
        name="Test",
        effective_from="2025-07-01",
        effective_to="2025-07-31",
        status="Active"
    )
    cat = catalogue_service.create_catalogue(cat_obj)
    fetched = catalogue_service.get_catalogue_by_id(cat.id)
    assert fetched is not None
    assert fetched.name == "Test"

def test_authenticate_success(auth_service):
    username = "testuser_" + random_string()
    password = "testpass_" + random_string()
    # Insert test user
    with auth_service.conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO admin_user_pass (username, password) VALUES (%s, %s)",
            (username, password)
        )
        auth_service.conn.commit()
    try:
        assert auth_service.authenticate(username, password) is True
    finally:
        # Clean up: remove the test user
        with auth_service.conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM admin_user_pass WHERE username = %s",
                (username,)
            )
            auth_service.conn.commit()

def test_authenticate_fail(auth_service):
    assert auth_service.authenticate("nonexistentuser", "wrongpass") is False

@pytest.fixture(autouse=True)
def cleanup_auth_test_users():
    yield
    conn = AuthService().conn
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM admin_user_pass WHERE username LIKE 'testuser_%'")
        conn.commit()

@pytest.fixture(autouse=True)
def cleanup_catalogue_test_entries():
    yield
    conn = CatalogueService().conn
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM catalogue WHERE name = 'Test'")
        conn.commit()

@pytest.fixture(autouse=True)
def rollback_after_test():
    conn = CatalogueService().conn  # or shared db connector
    cursor = conn.cursor()
    conn.autocommit = False
    conn.start_transaction()
    yield
    conn.rollback()
    conn.autocommit = True
    cursor.close()
    conn.close()

