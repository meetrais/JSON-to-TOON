from py_toon_format import encode, decode
from typing import Dict, Any, List

def main() -> None:
    """
    Demonstrates encoding a Python dictionary to TOON format and decoding it back.
    """
    # Sample data
    sample_data: Dict[str, List[Dict[str, Any]]] = {
        "users": [
            {"id": 1, "name": "Alice", "role": "admin"},
            {"id": 2, "name": "Bob", "role": "user"},
        ]
    }

    # Encode to TOON
    toon_string = encode(sample_data)
    print("--- TOON Format ---")
    print(toon_string)

    # Decode back to Python dictionary
    decoded_data = decode(toon_string)
    print("\n--- Decoded Data ---")
    print(decoded_data)

    # Verification
    assert sample_data == decoded_data
    print("\nVerification successful: Original and decoded data match.")

if __name__ == "__main__":
    main()
