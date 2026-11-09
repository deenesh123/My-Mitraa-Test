package com.mymitraa.taskflow.api_controller;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_successcode.SuccessCode;
import com.mymitraa.taskflow.api_domain.LeaveRequest;
import com.mymitraa.taskflow.api_repository.LeaveRequestRepository;
import com.mymitraa.taskflow.api_service.LeaveRequestService;
import com.mymitraa.taskflow.api_vm.LeaveRequestVM;
import com.mymitraa.taskflow.security.CustomUserDetails;

@RestController
@RequestMapping("/api/leave_requests")
public class LeaveRequestController {
    private static final Logger log = LoggerFactory.getLogger(LeaveRequestController.class);

    @Autowired
    private LeaveRequestService leaveRequestService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody LeaveRequest leaveRequest,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Leave request saving");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "LEAVE_REQUEST_SAVED_SUCCESS");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("LEAVE_REQUEST_SAVED_SUCCESS",
                        "Leave request saved successfully",
                        leaveRequestService.save(leaveRequest, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get leave request by id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "LEAVE_REQUEST_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("LEAVE_REQUEST_FETCHED_SUCCESSFULLY",
                        "Leave request fetched successfully",
                        leaveRequestService.getById(id), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody Object searchVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get leave requests");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "LEAVE_REQUESTS_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("LEAVE_REQUESTS_FETCHED_SUCCESSFULLY",
                        "Leave requests fetched successfully",
                        leaveRequestService.fetchAll(customUserDetails.getUsername(), (Pageable) searchVM), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody LeaveRequest leaveRequest,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("updating leave request with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "LEAVE_REQUEST_UPDATED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("LEAVE_REQUEST_UPDATED_SUCCESSFULLY",
                        "Leave request updated successfully",
                        leaveRequestService.update(leaveRequest, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("deleting leave request with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "LEAVE_REQUEST_DELETED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("LEAVE_REQUEST_DELETED_SUCCESSFULLY",
                        "Leave request deleted successfully",
                        leaveRequestService.delete(id), metaInfo),
                HttpStatus.OK);
    }
}