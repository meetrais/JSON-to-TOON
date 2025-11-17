# C# TOON Sample

This sample demonstrates how to serialize a C# object to both JSON and TOON formats for comparison.

## Prerequisites

- .NET SDK (v9.0 or later)

## Setup

1.  **Navigate to the `csharp` directory**:
    ```bash
    cd code-samples/csharp
    ```

2.  **Restore dependencies**:
    This will download the `ToonSharp` package.
    ```bash
    dotnet restore
    ```

## Running the Code

Execute the project from the root of the `csharp` directory:

```bash
dotnet run
```

### Expected Output

```
--- JSON Format ---
{
  "Users": [
    {
      "Id": 1,
      "Name": "Alice",
      "Role": "admin"
    },
    {
      "Id": 2,
      "Name": "Bob",
      "Role": "user"
    }
  ]
}

--- TOON Format ---
Users[2]{Id,Name,Role}:
  1,Alice,admin
  2,Bob,user
