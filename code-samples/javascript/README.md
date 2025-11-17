# JavaScript TOON Sample

This sample demonstrates how to encode a JavaScript object to TOON format and decode it back.

## Prerequisites

- Node.js (v14.x or later)
- npm

## Setup

1.  **Navigate to the `javascript` directory**:
    ```bash
    cd code-samples/javascript
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Running the Code

Execute the `index.js` script from the root of the `javascript` directory:

```bash
node index.js
```

### Expected Output

```
--- TOON Format ---
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user

--- Decoded Data ---
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

Verification successful: Original and decoded data match.
