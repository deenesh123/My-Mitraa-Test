package com.mymitraa.taskflow.api_controller;

import com.mymitraa.taskflow.api_domain.Bug;
import com.mymitraa.taskflow.api_repository.BugRepository;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bugs")
public class BugController {

    @Autowired
    private BugRepository bugRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'QA_TESTER', 'DEVELOPER', 'PROJECT_MANAGER')")
    public ResponseEntity<CustomResponse> getAllBugs(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String project) {
        List<Bug> list;
        if (severity != null && !severity.equalsIgnoreCase("All")) {
            list = bugRepository.findBySeverity(severity);
        } else if (status != null && !status.equalsIgnoreCase("All")) {
            list = bugRepository.findByStatus(status);
        } else if (project != null && !project.equalsIgnoreCase("All")) {
            list = bugRepository.findByProject(project);
        } else {
            list = bugRepository.findAll();
        }
        return ResponseEntity.ok(new CustomResponse(200, "BUGS_FETCHED_SUCCESSFULLY", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'QA_TESTER', 'DEVELOPER', 'PROJECT_MANAGER')")
    public ResponseEntity<CustomResponse> getBugById(@PathVariable("id") String id) {
        Optional<Bug> opt = bugRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "BUG_NOT_FOUND", null));
        }
        return ResponseEntity.ok(new CustomResponse(200, "BUG_FETCHED_SUCCESSFULLY", opt.get()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'QA_TESTER', 'DEVELOPER', 'PROJECT_MANAGER')")
    public ResponseEntity<CustomResponse> createBug(@RequestBody Bug bug) {
        if (bug.getBugCode() == null || bug.getBugCode().trim().isEmpty()) {
            bug.setBugCode("BUG-" + System.currentTimeMillis() % 100000);
        }
        if (bug.getCreatedAt() == null) {
            bug.setCreatedAt(new java.text.SimpleDateFormat("dd-MMM-yyyy HH:mm").format(new java.util.Date()));
        }
        Bug saved = bugRepository.save(bug);
        return ResponseEntity.ok(new CustomResponse(200, "BUG_CREATED_SUCCESSFULLY", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'QA_TESTER', 'DEVELOPER', 'PROJECT_MANAGER')")
    public ResponseEntity<CustomResponse> updateBug(@PathVariable("id") String id, @RequestBody Bug updates) {
        Optional<Bug> opt = bugRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "BUG_NOT_FOUND", null));
        }
        Bug existing = opt.get();
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getProject() != null) existing.setProject(updates.getProject());
        if (updates.getModule() != null) existing.setModule(updates.getModule());
        if (updates.getSeverity() != null) existing.setSeverity(updates.getSeverity());
        if (updates.getPriority() != null) existing.setPriority(updates.getPriority());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        if (updates.getAssignedTo() != null) existing.setAssignedTo(updates.getAssignedTo());
        if (updates.getReproductionSteps() != null) existing.setReproductionSteps(updates.getReproductionSteps());
        if (updates.getExpectedResult() != null) existing.setExpectedResult(updates.getExpectedResult());
        if (updates.getActualResult() != null) existing.setActualResult(updates.getActualResult());
        if (updates.getEnvironment() != null) existing.setEnvironment(updates.getEnvironment());
        Bug saved = bugRepository.save(existing);
        return ResponseEntity.ok(new CustomResponse(200, "BUG_UPDATED_SUCCESSFULLY", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'QA_TESTER', 'PROJECT_MANAGER')")
    public ResponseEntity<CustomResponse> deleteBug(@PathVariable("id") String id) {
        if (bugRepository.existsById(id)) {
            bugRepository.deleteById(id);
            return ResponseEntity.ok(new CustomResponse(200, "BUG_DELETED_SUCCESSFULLY", true));
        }
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                .body(new CustomResponse(404, "BUG_NOT_FOUND", false));
    }
}
