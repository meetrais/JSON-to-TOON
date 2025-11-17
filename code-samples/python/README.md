# Python TOON Sample

This sample demonstrates how to encode a Python dictionary to TOON format and decode it back.

## Prerequisites

- Python 3.6+
- `py-toon-format` package

## Setup

1.  **Install dependencies**:
    ```bash
    pip install py-toon-format
    ```

## Running the Code

Execute the `main.py` script from the root of the `python` directory:

```bash
python main.py
```

### Expected Output

```
--- TOON Format ---
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user

--- Decoded Data ---
{'users': [{'id': 1, 'name': 'Alice', 'role': 'admin'}, {'id': 2, 'name': 'Bob', 'role': 'user'}]}

Verification successful: Original and decoded data match.
