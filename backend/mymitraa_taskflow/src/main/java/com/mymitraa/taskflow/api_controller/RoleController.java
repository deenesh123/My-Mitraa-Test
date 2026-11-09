package com.mymitraa.taskflow.api_controller;

import com.mymitraa.taskflow.api_domain.Role;
import com.mymitraa.taskflow.api_domain.User;
import com.mymitraa.taskflow.api_repository.RoleRepository;
import com.mymitraa.taskflow.api_repository.UserRepository;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    private boolean isCallerSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equalsIgnoreCase("Super Admin"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<CustomResponse> getAllRoles() {
        List<Role> roles = roleRepository.findAll();
        return ResponseEntity.ok(new CustomResponse(200, "ROLES_FETCHED_SUCCESSFULLY", roles));
    }

    @GetMapping("/{name}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<CustomResponse> getRoleByName(@PathVariable("name") String name) {
        Optional<Role> roleOpt = roleRepository.findByName(name);
        if (roleOpt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "ROLE_NOT_FOUND", null));
        }
        return ResponseEntity.ok(new CustomResponse(200, "ROLE_FETCHED_SUCCESSFULLY", roleOpt.get()));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<CustomResponse> createRole(@RequestBody Role role) {
        if (role.getName() == null || role.getName().trim().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "Role name is required", null));
        }
        if (roleRepository.existsByName(role.getName().trim())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "Role already exists: " + role.getName(), null));
        }
        Role saved = roleRepository.save(role);
        return ResponseEntity.ok(new CustomResponse(200, "ROLE_CREATED_SUCCESSFULLY", saved));
    }

    @PutMapping("/{name}/permissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<CustomResponse> updateRolePermissions(
            @PathVariable("name") String name,
            @RequestBody Set<String> permissions) {
        
        // Security rule: Admin cannot modify Super Admin permissions
        if ("Super Admin".equalsIgnoreCase(name) && !isCallerSuperAdmin()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(new CustomResponse(403, "Admins cannot modify Super Admin permissions", null));
        }

        Optional<Role> roleOpt = roleRepository.findByName(name);
        Role role;
        if (roleOpt.isEmpty()) {
            role = new Role();
            role.setName(name);
        } else {
            role = roleOpt.get();
        }
        role.setPermissions(permissions);
        Role saved = roleRepository.save(role);
        return ResponseEntity.ok(new CustomResponse(200, "ROLE_PERMISSIONS_UPDATED_SUCCESSFULLY", saved));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<CustomResponse> assignRole(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        String roleName = payload.get("roleName");

        if (userId == null || roleName == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(new CustomResponse(400, "Both userId and roleName are required", null));
        }

        // Security rule: Only Super Admin can assign the Super Admin role
        if ("Super Admin".equalsIgnoreCase(roleName) && !isCallerSuperAdmin()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(new CustomResponse(403, "Only Super Admin can assign the Super Admin role", null));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "User not found", null));
        }

        User user = userOpt.get();
        // If modifying an existing Super Admin account, only Super Admin can do so
        if ("Super Admin".equalsIgnoreCase(user.getRole()) && !isCallerSuperAdmin()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(new CustomResponse(403, "Admins cannot modify Super Admin accounts", null));
        }

        user.setRole(roleName);
        User saved = userRepository.save(user);
        saved.setPassword(null);

        return ResponseEntity.ok(new CustomResponse(200, "ROLE_ASSIGNED_SUCCESSFULLY", saved));
    }
}
