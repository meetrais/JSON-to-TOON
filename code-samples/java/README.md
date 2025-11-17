# Java TOON Sample

This sample demonstrates how to serialize a Java `Map` to both JSON and TOON formats for comparison.

## Prerequisites

- Java Development Kit (JDK) (v8 or later)
- Apache Maven

## Setup

1.  **Navigate to the `java` directory**:
    ```bash
    cd code-samples/java
    ```

2.  **Install dependencies**:
    This will download the `jtoon` and `gson` packages.
    ```bash
    mvn clean install
    ```

## Running the Code

Execute the project from the root of the `java` directory:

```bash
mvn exec:java
```

### Expected Output

```
--- JSON Format ---
{
  "users": [
    {
      "id": 1,
      "role": "admin",
      "name": "Alice"
    },
    {
      "id": 2,
      "role": "user",
      "name": "Bob"
    }
  ]
}

--- TOON Format ---
users[2]{id,role,name}:
  1,admin,Alice
  2,user,Bob
