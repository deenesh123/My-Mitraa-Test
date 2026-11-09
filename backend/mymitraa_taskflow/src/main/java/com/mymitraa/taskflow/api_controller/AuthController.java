package com.mymitraa.taskflow.api_controller;

import com.mymitraa.taskflow.api_domain.User;
import com.mymitraa.taskflow.api_repository.UserRepository;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.security.CustomUserDetails;
import com.mymitraa.taskflow.security.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<CustomResponse> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String username = payload.get("username");
        String password = payload.get("password");
        String identifier = email != null && !email.trim().isEmpty() ? email.trim() : (username != null ? username.trim() : null);

        if (identifier == null || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(new CustomResponse(401, "Both identifier (email or username) and password are required for login"));
        }

        User user = userRepository.findByEmail(identifier).orElse(null);
        if (user == null) {
            user = userRepository.findByUsername(identifier);
        }

        if (user == null || user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(new CustomResponse(401, "Invalid username/email or password"));
        }

        if (!"Active".equalsIgnoreCase(user.getStatus()) || !user.isEnabled()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(new CustomResponse(403, "Account is deactivated or disabled. Please contact administrator."));
        }

        user.setLast_login(new java.text.SimpleDateFormat("dd-MMM-yyyy HH:mm").format(new Date()));
        try {
            userRepository.save(user);
        } catch (Exception ignored) {}

        String token = jwtTokenUtil.generateToken(user.getUsername() != null ? user.getUsername() : user.getEmail());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);

        Map<String, String> meta = new HashMap<>();
        meta.put("token", token);

        User safeUser = sanitizeUser(user);

        return ResponseEntity.ok()
                .headers(headers)
                .body(new CustomResponse("200", "LOGIN_SUCCESS", safeUser, meta));
    }

    @PostMapping("/register")
    public ResponseEntity<CustomResponse> register(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String email = payload.get("email");
        String username = payload.get("username");
        String password = payload.get("password");
        // Security enforcement: Public registration always creates an Employee account.
        // Client-supplied role information must never override the server-assigned role.
        String role = "Employee";
        String team = payload.getOrDefault("team", "Technology");

        if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "Name, email, and password are required for registration"));
        }

        if (password.trim().length() < 6) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "Password must be at least 6 characters long"));
        }

        if (userRepository.findByEmail(email.trim()).isPresent()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "User already exists with email: " + email));
        }

        String actualUsername = username != null && !username.trim().isEmpty()
                ? username.trim()
                : (email.contains("@") ? email.split("@")[0] : email);

        if (userRepository.findByUsername(actualUsername) != null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "Username already taken: " + actualUsername));
        }

        User user = new User();
        user.setName(name.trim());
        user.setEmail(email.trim());
        user.setUsername(actualUsername);
        user.setRole(role);
        user.setTeam(team);
        user.setStatus("Active");
        user.setEnabled(true);

        String avatar = Arrays.stream(name.split(" "))
                .filter(s -> !s.isEmpty())
                .map(s -> s.substring(0, 1).toUpperCase())
                .reduce("", (a, b) -> a + b);
        user.setAvatar(avatar.isEmpty() ? "U" : (avatar.length() > 2 ? avatar.substring(0, 2) : avatar));
        user.setCreated_date(new java.text.SimpleDateFormat("dd-MMM-yyyy").format(new Date()));
        user.setLast_login("Just now");
        user.setPassword(passwordEncoder.encode(password));

        User saved = userRepository.save(user);

        return ResponseEntity.ok(new CustomResponse("200", "REGISTRATION_SUCCESS", sanitizeUser(saved)));
    }

    @GetMapping("/current")
    public ResponseEntity<CustomResponse> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = null;
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            user = ((CustomUserDetails) auth.getPrincipal()).getUser();
        } else if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            user = userRepository.findByUsername(auth.getName());
            if (user == null) {
                user = userRepository.findByEmail(auth.getName()).orElse(null);
            }
        }

        if (user != null) {
            return ResponseEntity.ok(new CustomResponse("200", "CURRENT_USER_FETCHED", sanitizeUser(user)));
        }

        return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                .body(new CustomResponse(401, "No authenticated session found"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<CustomResponse> changePassword(@RequestBody Map<String, String> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser")) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(new CustomResponse(401, "Authentication required"));
        }

        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "New password must be at least 6 characters long"));
        }

        String identifier = auth.getName();
        User user = userRepository.findByUsername(identifier);
        if (user == null) {
            user = userRepository.findByEmail(identifier).orElse(null);
        }

        if (user == null || user.getPassword() == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "Current password does not match"));
        }

        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);

        return ResponseEntity.ok(new CustomResponse("200", "PASSWORD_CHANGED_SUCCESSFULLY", true));
    }

    @PostMapping("/logout")
    public ResponseEntity<CustomResponse> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(new CustomResponse("200", "LOGGED_OUT_SUCCESSFULLY", true));
    }

    private User sanitizeUser(User user) {
        if (user == null) return null;
        User safe = new User();
        safe.setId(user.getId());
        safe.setUsername(user.getUsername());
        safe.setEmail(user.getEmail());
        safe.setName(user.getName());
        safe.setRole(user.getRole());
        safe.setRoles(user.getRoles());
        safe.setTeam(user.getTeam());
        safe.setStatus(user.getStatus());
        safe.setAvatar(user.getAvatar());
        safe.setCreated_date(user.getCreated_date());
        safe.setLast_login(user.getLast_login());
        safe.setEnabled(user.isEnabled());
        safe.setPassword(null); // Never expose password hash
        return safe;
    }
}
