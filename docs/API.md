# API Documentation

Base URL: `http://localhost:3000/api` (development)

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Authentication

### POST /auth/login
Login or register a volunteer.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/volunteers
Get list of all volunteers.

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
]
```

## Cats

### GET /cats
Get all cats with their latest photo.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Whiskers",
    "markings": "Orange tabby with white paws",
    "spayNeuter": true,
    "vaccinations": "Rabies, FVRCP",
    "building": "Building A",
    "lastSeenBy": "John Doe",
    "lastFed": "2024-01-28 AM",
    "daysNotSeen": 0,
    "photoCount": 5,
    "photos": [
      {
        "id": 1,
        "url": "/uploads/abc123.jpg",
        "date": "2024-01-28T10:30:00.000Z"
      }
    ]
  }
]
```

### GET /cats/:id
Get detailed cat information with all photos.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "name": "Whiskers",
  "markings": "Orange tabby with white paws",
  "spayNeuter": true,
  "vaccinations": "Rabies, FVRCP",
  "building": "Building A",
  "lastSeenBy": "John Doe",
  "lastFed": "2024-01-28 AM",
  "daysNotSeen": 0,
  "photos": [
    {
      "id": 1,
      "catId": 1,
      "url": "/uploads/abc123.jpg",
      "date": "2024-01-28T10:30:00.000Z",
      "uploader": "John Doe",
      "recognized": true,
      "ocrText": null
    }
  ]
}
```

### POST /cats
Create a new cat profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Mittens",
  "markings": "Black and white tuxedo",
  "building": "Building B",
  "spayNeuter": false,
  "vaccinations": "None yet",
  "photoId": 5
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Mittens",
  "markings": "Black and white tuxedo",
  "spayNeuter": false,
  "vaccinations": "None yet",
  "building": "Building B",
  "lastSeenBy": "John Doe",
  "daysNotSeen": 0
}
```

### PUT /cats/:id
Update cat information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Mittens Jr.",
  "markings": "Black and white tuxedo with pink nose",
  "spayNeuter": true,
  "vaccinations": "Rabies, FVRCP",
  "building": "Building B",
  "lastFed": "2024-01-28 PM",
  "lastSeenBy": "Jane Smith",
  "daysNotSeen": 0
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Mittens Jr.",
  "markings": "Black and white tuxedo with pink nose",
  "spayNeuter": true,
  "vaccinations": "Rabies, FVRCP",
  "building": "Building B",
  "lastSeenBy": "Jane Smith",
  "lastFed": "2024-01-28 PM",
  "daysNotSeen": 0,
  "photos": [...]
}
```

### DELETE /cats/:id
Delete a cat profile and all associated photos.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Cat deleted successfully"
}
```

### GET /cats/:id/photos
Get all photos for a specific cat.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "catId": 1,
    "url": "/uploads/abc123.jpg",
    "date": "2024-01-28T10:30:00.000Z",
    "uploader": "John Doe",
    "recognized": true,
    "ocrText": null
  }
]
```

## Photos

### POST /photos/upload
Upload a new photo with automatic cat recognition and OCR.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
```
photo: <file>
```

**Response:**
```json
{
  "photoId": 5,
  "recognized": true,
  "matches": [
    {
      "id": 1,
      "name": "Whiskers",
      "markings": "Orange tabby with white paws",
      "confidence": 0.85,
      "photos": [
        {
          "url": "/uploads/previous.jpg"
        }
      ]
    }
  ],
  "ocrText": "Tag #123"
}
```

### POST /photos/:id/assign
Assign an unrecognized photo to a cat.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "catId": 1
}
```

**Response:**
```json
{
  "message": "Photo assigned successfully"
}
```

**Note:** This endpoint also:
- Updates cat's `daysNotSeen` to 0
- Sets `lastSeenBy` to current user
- Deletes oldest photos if exceeding `MAX_PHOTOS_PER_CAT`

### GET /photos/unrecognized
Get all unrecognized photos.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 5,
    "catId": null,
    "url": "/uploads/xyz789.jpg",
    "date": "2024-01-28T11:00:00.000Z",
    "uploader": "John Doe",
    "recognized": false,
    "ocrText": "Tag #456"
  }
]
```

### DELETE /photos/:id
Delete a photo and its file.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Photo deleted successfully"
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

## Pagination

Currently not implemented. All list endpoints return all results. For large datasets, implement pagination:

```
GET /cats?page=1&limit=20
```

## Filtering & Sorting

Future enhancement:
```
GET /cats?building=A&sort=name&order=asc
```
