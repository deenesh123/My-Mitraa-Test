package com.mymitraa.taskflow.api_controller;

import com.mymitraa.taskflow.api_domain.Lead;
import com.mymitraa.taskflow.api_repository.LeadRepository;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    @Autowired
    private LeadRepository leadRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<CustomResponse> getAllLeads(
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String assignedTo) {
        List<Lead> leads;
        if (stage != null && !stage.equalsIgnoreCase("All")) {
            leads = leadRepository.findByStage(stage);
        } else if (assignedTo != null && !assignedTo.equalsIgnoreCase("All")) {
            leads = leadRepository.findByAssignedTo(assignedTo);
        } else {
            leads = leadRepository.findAll();
        }
        return ResponseEntity.ok(new CustomResponse(200, "LEADS_FETCHED_SUCCESSFULLY", leads));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<CustomResponse> getLeadById(@PathVariable("id") String id) {
        Optional<Lead> opt = leadRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "LEAD_NOT_FOUND", null));
        }
        return ResponseEntity.ok(new CustomResponse(200, "LEAD_FETCHED_SUCCESSFULLY", opt.get()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<CustomResponse> createLead(@RequestBody Lead lead) {
        if (lead.getLeadCode() == null || lead.getLeadCode().trim().isEmpty()) {
            lead.setLeadCode("LEAD-" + System.currentTimeMillis() % 100000);
        }
        Lead saved = leadRepository.save(lead);
        return ResponseEntity.ok(new CustomResponse(200, "LEAD_CREATED_SUCCESSFULLY", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<CustomResponse> updateLead(@PathVariable("id") String id, @RequestBody Lead updates) {
        Optional<Lead> opt = leadRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new CustomResponse(404, "LEAD_NOT_FOUND", null));
        }
        Lead existing = opt.get();
        if (updates.getContactName() != null) existing.setContactName(updates.getContactName());
        if (updates.getCompanyName() != null) existing.setCompanyName(updates.getCompanyName());
        if (updates.getEmail() != null) existing.setEmail(updates.getEmail());
        if (updates.getPhone() != null) existing.setPhone(updates.getPhone());
        if (updates.getStage() != null) existing.setStage(updates.getStage());
        if (updates.getAssignedTo() != null) existing.setAssignedTo(updates.getAssignedTo());
        if (updates.getExpectedRevenue() > 0) existing.setExpectedRevenue(updates.getExpectedRevenue());
        if (updates.getProbability() > 0) existing.setProbability(updates.getProbability());
        if (updates.getSource() != null) existing.setSource(updates.getSource());
        if (updates.getFollowUpDate() != null) existing.setFollowUpDate(updates.getFollowUpDate());
        if (updates.getNotes() != null) existing.setNotes(updates.getNotes());
        if (updates.getLostReason() != null) existing.setLostReason(updates.getLostReason());
        Lead saved = leadRepository.save(existing);
        return ResponseEntity.ok(new CustomResponse(200, "LEAD_UPDATED_SUCCESSFULLY", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<CustomResponse> deleteLead(@PathVariable("id") String id) {
        if (leadRepository.existsById(id)) {
            leadRepository.deleteById(id);
            return ResponseEntity.ok(new CustomResponse(200, "LEAD_DELETED_SUCCESSFULLY", true));
        }
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                .body(new CustomResponse(404, "LEAD_NOT_FOUND", false));
    }
}
