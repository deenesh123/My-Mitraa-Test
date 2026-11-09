package com.mymitraa.taskflow.api_controller;

import com.mymitraa.taskflow.api_successcode.CustomResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    @GetMapping
    public ResponseEntity<CustomResponse> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("app", "mymitraa-taskflow");
        health.put("version", "3.0.0");
        health.put("database", "mymitraa_taskflow");

        boolean dbConnected = false;
        if (mongoTemplate != null) {
            try {
                mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
                dbConnected = true;
            } catch (Exception e) {
                dbConnected = false;
            }
        }
        health.put("databaseConnected", dbConnected);

        return ResponseEntity.ok(new CustomResponse(200, "HEALTH_OK", health));
    }
}
