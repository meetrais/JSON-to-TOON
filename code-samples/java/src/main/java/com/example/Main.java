package main.java.com.example;

import com.felipestanzani.jtoon.JToon;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    public static void main(String[] args) {
        // Create sample data
        Map<String, Object> data = new HashMap<>();
        data.put("users", List.of(
            Map.of("id", 1, "name", "Alice", "role", "admin"),
            Map.of("id", 2, "name", "Bob", "role", "user")
        ));

        // --- JSON Serialization ---
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String jsonString = gson.toJson(data);
        System.out.println("--- JSON Format ---");
        System.out.println(jsonString);

        // --- TOON Serialization ---
        String toonString = JToon.encode(data);
        System.out.println("\n--- TOON Format ---");
        System.out.println(toonString);
    }
}
