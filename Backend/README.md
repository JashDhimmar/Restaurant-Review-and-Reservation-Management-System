# Restaurant Backend (Django + PostgreSQL)

## Quick Setup

### 1. Create & Activate Virtual Environment
```bash
cd Backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
copy .env.example .env
```
Edit `.env`:
```
SECRET_KEY=your-secret-key-change-this
DEBUG=True
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

### 4. Create PostgreSQL Database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE restaurant_db;
```

### 5. Run Migrations
```bash
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py migrate
```

### 6. Create Superuser (Admin)
```bash
python manage.py createsuperuser
```

### 7. Seed Initial Restaurant Data
```bash
python manage.py seed_restaurants
```

### 8. Start the Development Server
```bash
python manage.py runserver
```
The API will be live at **http://localhost:8000/api/**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Login (returns JWT tokens) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET/PATCH | `/api/auth/me/` | Get/update current user profile |
| GET | `/api/restaurants/` | List all restaurants |
| POST | `/api/restaurants/` | Create a restaurant (owner only) |
| GET | `/api/restaurants/{id}/` | Restaurant detail |
| GET | `/api/restaurants/my_restaurants/` | Owner's restaurants |
| GET/POST | `/api/reservations/` | List/create reservations |
| PATCH | `/api/reservations/{id}/update_status/` | Update reservation status |
| GET/POST | `/api/reviews/` | List/create reviews |
| GET | `/admin/` | Django Admin Panel |

---

## Project Structure
```
Backend/
├── manage.py
├── requirements.txt
├── .env.example
├── restaurant_backend/
│   ├── settings.py
│   └── urls.py
├── users/
│   ├── models.py       # Custom User with roles
│   ├── serializers.py  # Registration + JWT
│   ├── views.py
│   └── urls.py
└── core/
    ├── models.py        # Restaurant, Reservation, Review
    ├── serializers.py
    ├── views.py         # ViewSets with RBAC
    ├── permissions.py   # Custom permission classes
    ├── urls.py
    └── management/commands/
        └── seed_restaurants.py
```
