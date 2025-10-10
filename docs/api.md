# 📚 Swim Academy API Documentation

## 🔐 Authentication Endpoints

### POST /api/auth/register
**إنشاء حساب جديد**

**Request Body:**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "123456",
  "role": "subscriber",
  "phone": "+201012345678"
}