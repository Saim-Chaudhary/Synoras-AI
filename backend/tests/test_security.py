"""Unit tests for passwords and tokens. No database or network needed."""

from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.config import Settings
from app.core.security import (
    AuthConfigError,
    TokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

SETTINGS = Settings(_env_file=None, jwt_secret="a-secret-that-is-at-least-32-characters-long")


def test_password_hash_is_argon2_and_not_the_password():
    hashed = hash_password("correct horse")
    assert hashed.startswith("$argon2id$")
    assert "correct horse" not in hashed


def test_same_password_gets_a_different_hash_each_time():
    assert hash_password("same password") != hash_password("same password")


def test_verify_password():
    hashed = hash_password("correct horse")
    assert verify_password("correct horse", hashed) is True
    assert verify_password("wrong horse", hashed) is False


def test_a_broken_stored_hash_is_just_no_match():
    assert verify_password("anything", "not-a-real-hash") is False


def test_token_round_trip_gives_the_user_id():
    token = create_access_token(42, "User", SETTINGS)
    assert decode_access_token(token, SETTINGS) == 42


def test_expired_token_is_rejected():
    long_ago = datetime.now(timezone.utc) - timedelta(hours=5)
    token = create_access_token(1, "User", SETTINGS, now=long_ago)
    with pytest.raises(TokenError):
        decode_access_token(token, SETTINGS)


def test_token_signed_with_another_secret_is_rejected():
    other = Settings(_env_file=None, jwt_secret="a-completely-different-secret-of-32-chars-or-more")
    token = create_access_token(1, "User", other)
    with pytest.raises(TokenError):
        decode_access_token(token, SETTINGS)


def test_unsigned_token_with_alg_none_is_rejected():
    forged = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, None, algorithm="none")
    with pytest.raises(TokenError):
        decode_access_token(forged, SETTINGS)


def test_token_without_expiry_is_rejected():
    no_expiry = jwt.encode({"sub": "1"}, SETTINGS.jwt_secret.get_secret_value(), algorithm="HS256")
    with pytest.raises(TokenError):
        decode_access_token(no_expiry, SETTINGS)


def test_garbage_is_rejected():
    with pytest.raises(TokenError):
        decode_access_token("not.a.token", SETTINGS)


@pytest.mark.parametrize("secret", ["", "too-short"])
def test_missing_or_short_secret_is_a_configuration_error(secret):
    weak = Settings(_env_file=None, jwt_secret=secret)
    with pytest.raises(AuthConfigError) as caught:
        create_access_token(1, "User", weak)
    assert "JWT_SECRET" in str(caught.value)
