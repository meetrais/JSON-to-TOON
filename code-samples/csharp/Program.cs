using System;
using System.Collections.Generic;
using System.Text.Json;
using ToonSharp;

var data = new
{
    Users = new List<User>
    {
        new() { Id = 1, Name = "Alice", Role = "admin" },
        new() { Id = 2, Name = "Bob", Role = "user" }
    }
};

// --- JSON Serialization ---
var jsonOptions = new JsonSerializerOptions { WriteIndented = true };
string jsonString = JsonSerializer.Serialize(data, jsonOptions);
Console.WriteLine("--- JSON Format ---");
Console.WriteLine(jsonString);

// --- TOON Serialization ---
string toonOutput = ToonSerializer.Serialize(data);
Console.WriteLine("\n--- TOON Format ---");
Console.WriteLine(toonOutput);

public class User
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public required string Role { get; set; }
}
