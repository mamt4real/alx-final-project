# AlX Final Specialization Project

- Author: [Mahadi Abuhuraira](https://github.com/mamt4real)

# E-Photos API Documentation

Welcome to the Photos API documentation. This API allows users to manage their photo collections, perform CRUD (Create, Read, Update, Delete) operations on photos, interact with user accounts, and follow/unfollow other users.

## Base URL

- Local: `http://localhost:5500/api/v1`
- Live: `Coming soon!`

## Authentication

- Authentication is required for all endpoints except get all photos and download a photo.
- Include a token in the `Authorization` header for each request using the Bearer.

## Authentication Endpoints

### 1. Signup

- **URL**: `/auth/signup`
- **Method**: `POST`
- **Description**: Registers a new User.
- **Request Body**

```json
{
  "email": "mamt4real2@gmail.com",
  "password": "12345pass",
  "name": "Proxy User",
  "about": "An Intruder"
}
```

- **Response**:

- Status: 201 OK

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YmQ4NjQyMTk3MGQ2OTA3NTkxNjliYyIsInVzZXJuYW1lIjoibWFtdDRyZWFsMiIsImlhdCI6MTY5MDE0MjI3NDg5MCwiZXhwIjoxNjkwMTQyMzYxMjkwfQ.KiWccF3zwW0cZ0eS3rAn9oaD0pLgToV1H0RoEtR-PRs",
  "user": {
    "email": "user2@gmail.com",
    "name": "Proxy User",
    "about": "An Intruder",
    "role": "user",
    "username": "user2",
    "createdAt": "2023-07-23T19:57:54.733Z",
    "updatedAt": "2023-07-23T19:57:54.733Z",
    "id": "64bd86421970d690759169bc"
  }
}
```

### 2. Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Description**: Registers a new User.
- **Request Body**

```json
{
  "password": "12345pass",
  "email": "user2@gmail.com"
}
```

- **Response**:

- Status: 200 OK

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YmQ4NjQyMTk3MGQ2OTA3NTkxNjliYyIsInVzZXJuYW1lIjoibWFtdDRyZWFsMiIsImlhdCI6MTY5MDE0MjI3NDg5MCwiZXhwIjoxNjkwMTQyMzYxMjkwfQ.KiWccF3zwW0cZ0eS3rAn9oaD0pLgToV1H0RoEtR-PRs",
  "user": {
    "email": "user2@gmail.com",
    "name": "Proxy User",
    "about": "An Intruder",
    "role": "user",
    "username": "user2",
    "createdAt": "2023-07-23T19:57:54.733Z",
    "updatedAt": "2023-07-23T19:57:54.733Z",
    "id": "64bd86421970d690759169bc"
  }
}
```

## Photos Endpoints

### 1. Get All Photos

- **URL**: `/photos`
- **Method**: `GET`
- **Description**: Get a list of all photos in the collection.
- **Request Parameters**: None
- **Response**:

- Status: 200 OK

```json
[
  {
    "id": "photo1",
    "title": "Sunset at the beach",
    "url": "https://example.com/photos/sunset.jpg",
    "description": "Beautiful sunset view at the beach",
    "likes": ["user_id_1", "user_id_2"],
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": "2023-04-03T08:30:00Z"
  }
  // Additional photo objects
]
```

### 2. Get a Single Photo

- **URL**: `/photos/:id`
- **Method**: `GET`
- **Description**: Get details of a specific photo.
- **Request Parameters**:
  - `id`: (string) The ID of the photo to retrieve.
- **Response**:

- Status: 200 OK

```json
{
  "id": "photo1",
  "title": "Sunset at the beach",
  "url": "https://example.com/photos/sunset.jpg",
  "description": "Beautiful sunset view at the beach",
  "likes": 15,
  "createdAt": "2023-04-01T12:00:00Z",
  "updatedAt": "2023-04-03T08:30:00Z"
}
```

### 3. Upload a Photo

- **URL**: `/photos`
- **Method**: `POST`
- **Description**: Add a new photo to the collection.
- **Multipart File**: image
- **Request Body**:

```json
{
  "title": "New Photo",
  "description": "A brand new photo"
}
```

- **Response**:
- Status: 201 Created

```json
{
  "id": "photo2",
  "title": "New Photo",
  "url": "https://example.com/photos/newphoto.jpg",
  "description": "A brand new photo",
  "likes": [],
  "createdAt": "2023-04-03T15:45:00Z",
  "updatedAt": "2023-04-03T15:45:00Z"
}
```

### 4. Update a Photo

- **URL**: `/photos/:id`
- **Method**: `PUT`
- **Description**: Update details of an existing photo.
- **Request Parameters**:
  - `id`: (string) The ID of the photo to update.
- **Request Body**:

```json
{
  "title": "Updated Photo Title",
  "description": "Updated photo description"
}
```

- **Response**:
- Status: 200 Ok

```json
{
  "id": "photo2",
  "title": "Updated Photo Title",
  "url": "https://example.com/photos/newphoto.jpg",
  "description": "Updated photo description",
  "likes": 0,
  "createdAt": "2023-04-03T15:45:00Z",
  "updatedAt": "2023-04-03T16:30:00Z"
}
```

### 5. Delete a Photo

- **URL**: `/photos/:id`
- **Method**: `DELETE`
- **Description**: Delete a photo from the collection.
- **Request Parameters**:
  - `id`: (string) The ID of the photo to delete.
- **Response**:
- Status: 204 No Content

## Users Endpoints

### 1. Get All Users

- **URL**: `/users`
- **Method**: `GET`
- **Description**: Get a list of all users.
- **Request Parameters**: None
- **Response**:

Status: 200 Ok

```json
[
  {
    "id": "user1",
    "username": "user123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2023-04-01T12:00:00Z"
  }
  // Additional user objects
]
```

### 2. Get a Single User

- **URL**: `/users/:id`
- **Method**: `GET`
- **Description**: Get details of a specific user.
- **Request Parameters**:
  - `id`: (string) The ID of the user to retrieve.
- **Response**:

Status: 200 OK

```json
{
  "id": "user1",
  "username": "user123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "createdAt": "2023-04-01T12:00:00Z"
}
```

### 3. Create a User

- **URL**: `/users`
- **Method**: `POST`
- **Description**: Add a new user to the system.
- **Request Body**:

```json
{
  "username": "newuser",
  "name": "New User",
  "email": "new.user@example.com",
  "password": "password123"
}
```

- **Response**:
  Status: 201 Created

```json
{
  "id": "user2",
  "username": "newuser",
  "name": "New User",
  "email": "new.user@example.com",
  "createdAt": "2023-04-03T15:45:00Z"
}
```

### 4. Update a User

- **URL**: `/users/:id`
- **Method**: `PUT`
- **Description**: Update details of an existing user.
- **Request Parameters**:
  - `id`: (string) The ID of the user to update.
- **Request Body**:

```json
{
  "name": "Updated User",
  "email": "updated.user@example.com"
}
```

- **Response**:
  Status: 200 Ok

```json
{
  "id": "user2",
  "username": "newuser",
  "name": "Updated User",
  "email": "updated.user@example.com",
  "createdAt": "2023-04-03T15:45:00Z"
}
```

### 5. Delete a User

- **URL**: `/users/:id`
- **Method**: `DELETE`
- **Description**: Delete a user from the system.
- **Request Parameters**:
  - `id`: (string) The ID of the user to delete.
- **Response**:
  Status: 204 No Content

## Follow/Unfollow Endpoints

### 1. Follow a User

- **URL**: `/users/me/followings`
- **Method**: `POST`
- **Description**: Follow a user.
- **Request Body**:

```json
{
  "userId": "id_of_user_to_follow"
}
```

- **Response**:
  Status: 200 Ok

```json
{
  "status": "success",
  "message": "Operation Successful"
}
```

=

### 2. Unfollow a User

- **URL**: `/users/me/followings`
- **Method**: `DELETE`
- **Description**: Unfollow a user.
- **Request Body**:

```json
{
  "userId": "id_of_user_to_follow"
}
```

- **Response**:
  Status: 200 Ok

```json
{
  "status": "success",
  "message": "Operation Successful"
}
```

## Like Photo Endpoint

### 1. Like a Photo

- **URL**: `/photos/:photoId/like`
- **Method**: `POST`
- **Description**: Like a photo.
- **Request Parameters**:
  - `photoId`: (string) The ID of the photo to like.
- **Response**:
  Status: 200 Ok

```json
{
  "status": "success",
  "message": "Updated successfully"
}
```

## Error Handling

- The API returns appropriate error codes and messages for invalid requests.

## Rate Limiting

- The API enforces rate limiting to prevent abuse.

## Support and Contact

For support or inquiries, please contact mamt4real@gmail.com.

## License

This API is provided under the [MIT License](https://opensource.org/licenses/MIT).
