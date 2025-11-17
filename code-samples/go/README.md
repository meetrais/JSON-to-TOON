# Go TOON Sample

This sample demonstrates how to serialize a Go struct to both JSON and TOON formats for comparison.

## Prerequisites

- Go (v1.18 or later)

## Setup

1.  **Navigate to the `go` directory**:
    ```bash
    cd code-samples/go
    ```

2.  **Tidy dependencies**:
    This will download the `goon` package.
    ```bash
    go mod tidy
    ```

## Running the Code

Execute the `main.go` script from the root of the `go` directory:

```bash
go run main.go
```

### Expected Output

```
--- JSON Format ---
{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "role": "admin"
    },
    {
      "id": 2,
      "name": "Bob",
      "role": "user"
    }
  ]
}

--- TOON Format ---
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
