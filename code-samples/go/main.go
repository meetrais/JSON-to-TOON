package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/roboogg133/goon/goon"
)

// User represents a user with both JSON and TOON tags.
type User struct {
	ID   int    `json:"id" toon:"id"`
	Name string `json:"name" toon:"name"`
	Role string `json:"role" toon:"role"`
}

// Data represents the top-level structure.
type Data struct {
	Users []User `json:"users" toon:"users"`
}

func main() {
	// Create sample data
	data := Data{
		Users: []User{
			{ID: 1, Name: "Alice", Role: "admin"},
			{ID: 2, Name: "Bob", Role: "user"},
		},
	}

	// --- JSON Serialization ---
	jsonBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Fatalf("JSON marshal error: %v", err)
	}
	fmt.Println("--- JSON Format ---")
	fmt.Println(string(jsonBytes))

	// --- TOON Serialization ---
	toonBytes, err := goon.Marshal(data)
	if err != nil {
		log.Fatalf("TOON marshal error: %v", err)
	}
	fmt.Println("\n--- TOON Format ---")
	fmt.Println(string(toonBytes))
}
