import secrets


if __name__ == "__main__":
    # Prints a strong, URL-safe secret suitable for APEX_JWT_SECRET.
    print(secrets.token_urlsafe(48))

