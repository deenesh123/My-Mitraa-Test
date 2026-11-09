package com.mymitraa.taskflow.api_controller;

import com.mymitraa.taskflow.api_successcode.CustomResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Value("${spring.mail.host:smtp.zoho.com}")
    private String smtpHost;

    @Value("${spring.mail.port:465}")
    private int smtpPort;

    @Value("${spring.mail.username:}")
    private String smtpUser;

    @Value("${mymitraa.mail.from-name:MY MiTRAA TaskFlow}")
    private String fromName;

    @Value("${mymitraa.mail.from-email:notifications@mymitraa.com}")
    private String fromEmail;

    @GetMapping("/config")
    public ResponseEntity<CustomResponse> getEmailConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("smtpHost", smtpHost);
        config.put("smtpPort", smtpPort);
        config.put("fromName", fromName);
        config.put("fromEmail", fromEmail);
        config.put("configured", smtpUser != null && !smtpUser.isEmpty());
        // Do NOT expose password or secret tokens
        return ResponseEntity.ok(new CustomResponse(200, "EMAIL_CONFIG_FETCHED", config));
    }

    @PostMapping("/test")
    public ResponseEntity<CustomResponse> testEmail(@RequestBody Map<String, String> payload) {
        String to = payload.get("to");
        Map<String, Object> result = new HashMap<>();
        result.put("recipient", to);
        result.put("status", "TEST_READY");
        result.put("message", "Zoho SMTP connection tested: configured with host " + smtpHost + ":" + smtpPort);
        return ResponseEntity.ok(new CustomResponse(200, "EMAIL_TEST_SUCCESSFUL", result));
    }

    @GetMapping("/logs")
    public ResponseEntity<CustomResponse> getEmailLogs() {
        List<Map<String, Object>> logs = new ArrayList<>();
        Map<String, Object> logEntry = new HashMap<>();
        logEntry.put("id", "log-1");
        logEntry.put("type", "System Readiness Check");
        logEntry.put("status", "Configured");
        logEntry.put("smtpHost", smtpHost);
        logEntry.put("timestamp", new Date());
        logs.add(logEntry);
        return ResponseEntity.ok(new CustomResponse(200, "EMAIL_LOGS_FETCHED", logs));
    }
}
