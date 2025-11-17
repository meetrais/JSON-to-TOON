# JSON to TOON Conversion Guide

A comprehensive guide for converting JSON to TOON format to reduce LLM token usage by 30-60%.

## Table of Contents

- [What is TOON?](#what-is-toon)
- [Why Use TOON?](#why-use-toon)
- [JSON vs TOON Comparison](#json-vs-toon-comparison)
- [Quick Start](#quick-start)
  - [Python](#python)
  - [JavaScript/TypeScript](#javascripttypescript)
  - [Java](#java)
  - [Go](#go)
  - [C# (.NET)](#c-net)
- [When to Use TOON](#when-to-use-toon)
- [TOON Syntax Examples](#toon-syntax-examples)
- [Resources](#resources)

---

## What is TOON?

**TOON (Token-Oriented Object Notation)** is a compact, human-readable data serialization format designed specifically to optimize data exchange with Large Language Models (LLMs).

### Key Features

- ** Token Efficient**: 30-60% fewer tokens compared to JSON
- ** LLM Optimized**: Designed for AI comprehension
- ** Indentation-Based**: Uses whitespace instead of braces (like YAML)
- ** Tabular Arrays**: Declares keys once, streams data as rows
- ** Human Readable**: Clean, easy to debug

---

## Why Use TOON?

### The Problem with JSON

JSON is verbose. Every object in an array repeats all key names:

```json
{
  "users": [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"}
  ]
}
```

**Token Count**: ~51 tokens

### The TOON Solution

TOON declares keys once and streams values:

```toon
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

**Token Count**: ~24 tokens (53% reduction!)

---

## JSON vs TOON Comparison

| Feature | JSON | TOON |
|---------|------|------|
| Token Usage | High | 30-60% lower |
| Syntax | Verbose (braces, quotes) | Minimal |
| LLM Accuracy | 69.7% | 73.9% |
| Best For | Universal APIs | LLM prompts |
| Human Readable | ✅ | ✅ |

### Real-World Example

**JSON (257 tokens)**:
```json
{
  "users": [
    {"id": 1, "name": "Alice", "role": "admin", "salary": 75000},
    {"id": 2, "name": "Bob", "role": "user", "salary": 65000},
    {"id": 3, "name": "Charlie", "role": "user", "salary": 70000}
  ]
}
```

**TOON (166 tokens - 35% reduction)**:
```toon
users[3]{id,name,role,salary}:
  1,Alice,admin,75000
  2,Bob,user,65000
  3,Charlie,user,70000
```

---

## Quick Start

## Python

**Installation**:
```bash
pip install py-toon-format
```

**Usage**:
```python
from py_toon_format import encode, decode

# Your data
data = {
    "users": [
        {"id": 1, "name": "Alice", "role": "admin"},
        {"id": 2, "name": "Bob", "role": "user"}
    ]
}

# Convert to TOON
toon_string = encode(data)
print(toon_string)

# Convert back to Python dict
original_data = decode(toon_string)
```

---

## JavaScript/TypeScript

**Setup**:

1.  **Initialize your project**:
    ```bash
    npm init -y
    ```

2.  **Enable ES Modules**:
    Add the following line to your `package.json` file:
    ```json
    "type": "module"
    ```

**Installation**:
```bash
npm install @toon-format/toon
```

**Usage**:

Save the following as `index.js`:
```javascript
import { encode, decode } from '@toon-format/toon';

// Your data
const data = {
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ]
};

// Convert to TOON
const toonString = encode(data);
console.log(toonString);
```

**CLI Tool**:
```bash
# Encode JSON to TOON
npx @toon-format/cli data.json -o data.toon

# Decode TOON to JSON
npx @toon-format/cli data.toon -o data.json

# Show token stats
npx @toon-format/cli data.json --stats
```

---

## Java

**Maven Dependency**:
```xml
<dependency>
    <groupId>com.felipestanzani</groupId>
    <artifactId>jtoon</artifactId>
    <version>0.1.2</version>
</dependency>
```

**Usage**:
```java
import com.felipestanzani.jtoon.JToon;
import java.util.*;

public class ToonExample {
    public static void main(String[] args) {
        // Create data
        Map<String, Object> user1 = new HashMap<>();
        user1.put("id", 1);
        user1.put("name", "Alice");
        user1.put("role", "admin");

        Map<String, Object> user2 = new HashMap<>();
        user2.put("id", 2);
        user2.put("name", "Bob");
        user2.put("role", "user");

        Map<String, Object> data = new HashMap<>();
        data.put("users", Arrays.asList(user1, user2));

        // Convert to TOON
        String toonOutput = JToon.encode(data);
        System.out.println(toonOutput);

        // Or from JSON string
        String jsonString = "{\"users\":[{\"id\":1,\"name\":\"Alice\"}]}";
        String toonFromJson = JToon.encodeJson(jsonString);
        System.out.println(toonFromJson);
    }
}
```

---

## Go

**Installation**:
```bash
go get github.com/roboogg133/goon/goon
```

**Usage**:
```go
package main

import (
    "encoding/json"
    "fmt"
    "github.com/roboogg133/goon/goon"
)

type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
    Role string `json:"role"`
}

type Data struct {
    Users []User `json:"users"`
}

func main() {
    // Create data
    data := Data{
        Users: []User{
            {ID: 1, Name: "Alice", Role: "admin"},
            {ID: 2, Name: "Bob", Role: "user"},
        },
    }

    // Convert to JSON to show comparison
    jsonBytes, _ := json.Marshal(data)
    fmt.Println("JSON:")
    fmt.Println(string(jsonBytes))

    // Convert same data to TOON format
    // Note: goon works with structs directly, need to use toon tags
    type ToonUser struct {
        ID   int    `toon:"id"`
        Name string `toon:"name"`
        Role string `toon:"role"`
    }

    type ToonData struct {
        Users []ToonUser `toon:"users"`
    }

    toonData := ToonData{
        Users: []ToonUser{
            {ID: 1, Name: "Alice", Role: "admin"},
            {ID: 2, Name: "Bob", Role: "user"},
        },
    }

    toonOutput, _ := goon.Marshal(toonData)
    fmt.Println("\nTOON:")
    fmt.Println(string(toonOutput))
}
```

---

## C# (.NET)

**NuGet Package**:
```bash
dotnet add package ToonSharp
```

**Note**: Requires .NET 9.0 or later

**Usage**:
```csharp
using System;
using System.Collections.Generic;
using System.Text.Json;
using ToonSharp;

public class ToonExample
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Role { get; set; }
    }

    public static void Main()
    {
        // Create data
        var data = new
        {
            Users = new List<User>
            {
                new User { Id = 1, Name = "Alice", Role = "admin" },
                new User { Id = 2, Name = "Bob", Role = "user" }
            }
        };

        // Convert to JSON string first
        string jsonString = JsonSerializer.Serialize(data);
        Console.WriteLine("JSON:");
        Console.WriteLine(jsonString);

        // Convert to TOON
        string toonOutput = ToonSerializer.Serialize(data);
        Console.WriteLine("\nTOON:");
        Console.WriteLine(toonOutput);
    }
}
```

---

## When to Use TOON

### ✅ Best Use Cases

- **Database Query Results**: Uniform rows of data
- **API Responses**: Lists of objects with consistent fields
- **Analytics Data**: Structured datasets for LLM analysis
- **Chatbot Contexts**: Feeding structured data to AI
- **RAG Systems**: Optimizing context window usage
- **Cost-Sensitive Applications**: High-volume LLM API calls

### ❌ When NOT to Use TOON

- **Deeply Nested Structures**: JSON is more efficient
- **Non-Uniform Data**: Irregular object shapes
- **Existing JSON Pipelines**: If migration cost exceeds savings
- **Pure Tabular Data**: Use CSV instead (even more compact)

---

## TOON Syntax Examples

### Simple Object

**JSON**:
```json
{
  "name": "Alice",
  "age": 30,
  "city": "Boston"
}
```

**TOON**:
```toon
name: Alice
age: 30
city: Boston
```

---

### Nested Object

**JSON**:
```json
{
  "user": {
    "name": "Alice",
    "contact": {
      "email": "alice@example.com",
      "phone": "555-1234"
    }
  }
}
```

**TOON**:
```toon
user:
  name: Alice
  contact:
    email: alice@example.com
    phone: 555-1234
```

---

### Array of Objects (Tabular)

**JSON**:
```json
{
  "products": [
    {"id": 1, "name": "Laptop", "price": 999},
    {"id": 2, "name": "Mouse", "price": 29},
    {"id": 3, "name": "Keyboard", "price": 79}
  ]
}
```

**TOON**:
```toon
products[3]{id,name,price}:
  1,Laptop,999
  2,Mouse,29
  3,Keyboard,79
```

---

### Custom Delimiters

For data containing commas, use pipes or tabs:

**Pipe Delimiter**:
```toon
addresses[2]{street,city,country}|:
  123 Main St, Suite 100|Boston|USA
  456 Oak Ave, Apt 5B|Seattle|USA
```

**Tab Delimiter**:
```toon
items[2	]{sku	qty	price}:
  A1	2	9.99
  B2	1	14.50
```

---

## Resources

### Official Documentation
- **GitHub**: [toon-format/toon](https://github.com/toon-format/toon)
- **Specification**: [toon-format/spec](https://github.com/toon-format/spec)

### Online Tools
- [JSON to TOON Converter](https://jsontoon.com)
- [TOON Validator](https://jsontotable.org/blog/toon/toon-format-specification)

### Libraries

| Language | Package | Repository |
|----------|---------|------------|
| Python | `py-toon-format` | [xaviviro/python-toon](https://github.com/xaviviro/python-toon) |
| JavaScript | `@toon-format/toon` | [toon-format/toon](https://github.com/toon-format/toon) |
| Java | `jtoon` | Community package |
| Go | `go-toon` | [gotoon/go-toon](https://github.com/gotoon/go-toon) |
| C# | `ToonSharp` | Community package |
| Rust | In development | [toon-format/toon-rust](https://github.com/toon-format/toon-rust) |

### Articles & Tutorials
- [TOON vs JSON: Complete Analysis](https://toonifyit.com/blog/toon-vs-json)
- [What is TOON Format?](https://www.freecodecamp.org/news/what-is-toon-how-token-oriented-object-notation-could-change-how-ai-sees-data/)
- [TOON Format Cheat Sheet](https://www.nihardaily.com/137-toon-format-cheat-sheet-quick-reference-for-developers)

---

## Benchmarks

TOON achieves 73.9% accuracy (vs JSON's 69.7%) while using 39.6% fewer tokens across multiple LLM models including GPT-4, Claude, and Gemini.

### Token Comparison

| Format | Tokens | Accuracy | Efficiency Score |
|--------|--------|----------|------------------|
| TOON | 2,744 | 73.9% | 26.9 |
| JSON Compact | 3,081 | 70.7% | 22.9 |
| YAML | 3,719 | 69.0% | 18.6 |
| JSON | 4,545 | 69.7% | 15.3 |
| XML | 5,167 | 67.1% | 13.0 |

---

## Contributing

TOON is an open-source format with active development across multiple languages. Contributions are welcome!

- Report issues on respective library repositories
- Submit pull requests for improvements
- Share benchmarks and use cases

---

## License

TOON format specification is open-source. Individual library licenses vary by implementation.

---

## Quick Tips

1. **Start Small**: Try TOON on a single API endpoint first
2. **Measure Results**: Use token counting tools to verify savings
3. **Hybrid Approach**: Use JSON internally, TOON for LLM communication
4. **Cache Conversions**: Convert once, reuse TOON strings
5. **Test with Your LLM**: Benchmark with your specific model and data

---

**Ready to save tokens?** Start converting your JSON to TOON today and reduce your LLM API costs!
