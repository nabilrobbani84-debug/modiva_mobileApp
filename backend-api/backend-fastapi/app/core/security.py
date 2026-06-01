from jose import jwt, JWTError
from fastapi import HTTPException, status

SECRET_KEY = "django-insecure-*w&gr8p7#bfc7&x*h_a5tz1++=2_y_p8or0agw@51t4!o&4d7u"  # harus sama konsepnya dengan Django
ALGORITHM = "HS256"

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid"
        )