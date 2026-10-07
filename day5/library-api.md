```markdown
# Library REST API Design

This API is designed for a library system. The main resource is `books`.

## 1. List All Books

- **Method:** GET
- **Path:** `/api/books`
- **Description:** Returns a list of all books in the library.
- **Success Status:** 200 OK

### Example Response

```json
[
    {
        "id": 1,
        "title": "Things Fall Apart",
        "author": "Chinua Achebe",
        "year": 1958
    }
]
```

---

## 2. Get One Book

- **Method:** GET
- **Path:** `/api/books/:id`
- **Description:** Returns one book using its ID.
- **Success Status:** 200 OK

### Example Request

```text
GET /api/books/1
```

---

## 3. Create a Book

- **Method:** POST
- **Path:** `/api/books`
- **Description:** Adds a new book to the library.
- **Success Status:** 201 Created

### Example Request Body

```json
{
    "title": "The River Between",
    "author": "Ngugi wa Thiong'o",
    "year": 1965
}
```

---

## 4. Update a Book

- **Method:** PUT
- **Path:** `/api/books/:id`
- **Description:** Updates an existing book using its ID.
- **Success Status:** 200 OK

### Example Request

```text
PUT /api/books/1
```

### Example Request Body

```json
{
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958
}
```

---

## 5. Delete a Book

- **Method:** DELETE
- **Path:** `/api/books/:id`
- **Description:** Removes a book from the library.
- **Success Status:** 204 No Content

### Example Request

```text
DELETE /api/books/1
```

---

## 6. List Books by Author

- **Method:** GET
- **Path:** `/api/books?author=Chinua%20Achebe`
- **Description:** Returns books written by the specified author.
- **Success Status:** 200 OK

### Example Request

```text
GET /api/books?author=Chinua%20Achebe
```

---

# Error Responses

## 400 Bad Request

A 400 error is returned when the request contains invalid or missing information.

### Example

A request to create a book without a title:

```json
{
    "author": "Chinua Achebe",
    "year": 1958
}
```

### Response

```json
{
    "error": "Title is required."
}
```

**Status:** 400 Bad Request

---

## 404 Not Found

A 404 error is returned when the requested book does not exist.

### Example Request

```text
GET /api/books/9999
```

### Response

```json
{
    "error": "Book not found."
}
```

**Status:** 404 Not Found
```