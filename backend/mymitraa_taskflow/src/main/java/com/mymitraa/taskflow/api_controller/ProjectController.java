package com.mymitraa.taskflow.api_controller;

import com.mymitraa.taskflow.api_domain.Project;
import com.mymitraa.taskflow.api_repository.ProjectRepository;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_TESTER', 'CLIENT')")
    public ResponseEntity<CustomResponse> getAllProjects(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        List<Project> list;
        if (status != null && !status.equalsIgnoreCase("All")) {
            list = projectRepository.findByStatus(status);
        } else {
            list = projectRepository.findAll();
        }
        return ResponseEntity.ok(new CustomResponse(200, "PROJECTS_FETCHED_SUCCESSFULLY", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_TESTER', 'CLIENT')")
    public ResponseEntity<CustomResponse> getProjectById(@PathVariable("id") String id) {
        Optional<Project> opt = projectRepository.findById(id);
        if (opt.isEmpty()) {
            opt = projectRepository.findByProjectId(id);
        }
        if (opt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "PROJECT_NOT_FOUND", null));
        }
        return ResponseEntity.ok(new CustomResponse(200, "PROJECT_FETCHED_SUCCESSFULLY", opt.get()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<CustomResponse> createProject(@RequestBody Project project) {
        if (project.getProjectId() == null || project.getProjectId().trim().isEmpty()) {
            project.setProjectId("PRJ-" + System.currentTimeMillis() % 100000);
        }
        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(new CustomResponse(200, "PROJECT_CREATED_SUCCESSFULLY", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<CustomResponse> updateProject(@PathVariable("id") String id, @RequestBody Project updates) {
        Optional<Project> opt = projectRepository.findById(id);
        if (opt.isEmpty()) {
            opt = projectRepository.findByProjectId(id);
        }
        if (opt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "PROJECT_NOT_FOUND", null));
        }
        Project existing = opt.get();
        if (updates.getProjectName() != null) existing.setProjectName(updates.getProjectName());
        if (updates.getCustomerName() != null) existing.setCustomerName(updates.getCustomerName());
        if (updates.getProjectManager() != null) existing.setProjectManager(updates.getProjectManager());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        if (updates.getPriority() != null) existing.setPriority(updates.getPriority());
        if (updates.getStartDate() != null) existing.setStartDate(updates.getStartDate());
        if (updates.getTargetDate() != null) existing.setTargetDate(updates.getTargetDate());
        if (updates.getCompletionPercentage() > 0) existing.setCompletionPercentage(updates.getCompletionPercentage());
        if (updates.getHealthScore() != null) existing.setHealthScore(updates.getHealthScore());
        if (updates.getMembers() != null) existing.setMembers(updates.getMembers());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        Project saved = projectRepository.save(existing);
        return ResponseEntity.ok(new CustomResponse(200, "PROJECT_UPDATED_SUCCESSFULLY", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<CustomResponse> deleteProject(@PathVariable("id") String id) {
        Optional<Project> opt = projectRepository.findById(id);
        if (opt.isEmpty()) {
            opt = projectRepository.findByProjectId(id);
        }
        if (opt.isPresent()) {
            projectRepository.deleteById(opt.get().getId());
            return ResponseEntity.ok(new CustomResponse(200, "PROJECT_DELETED_SUCCESSFULLY", true));
        }
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                .body(new CustomResponse(404, "PROJECT_NOT_FOUND", false));
    }
}
