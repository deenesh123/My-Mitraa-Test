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
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mymitraa.taskflow.api_domain.AdvanceSearchList;
import com.mymitraa.taskflow.api_domain.OptimaLeaveTracker;
import com.mymitraa.taskflow.api_errors.CustomExceptionCode;
import com.mymitraa.taskflow.api_errors.RegisteredException;
import com.mymitraa.taskflow.api_service.OptimaLeaveTrackerService;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_successcode.SuccessCode;
import com.mymitraa.taskflow.api_vm.OptimaLeaveTrackerVM;
import com.mymitraa.taskflow.api_vm.SearchVM;
import com.mymitraa.taskflow.config.Constants;
import com.mymitraa.taskflow.security.CustomUserDetails;

@RestController
@RequestMapping("/api/optima_leave_tracker")
public class OptimaLeaveTrackerController {
    private static final Logger log = LoggerFactory.getLogger(OptimaLeaveTrackerController.class);

    @Autowired
    private OptimaLeaveTrackerService optimaLeaveTrackerService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody OptimaLeaveTracker optimaLeaveTracker,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("OptimaLeaveTracker data saving");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_DATA_SAVED_SUCCESS.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_DATA_SAVED_SUCCESS.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_DATA_SAVED_SUCCESS.getSuccessMessage(),
                        optimaLeaveTrackerService.save(optimaLeaveTracker, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get data of OptimaLeaveTracker using OptimaLeaveTracker id" + id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.getById(id, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody SearchVM searchVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get OptimaLeaveTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.fetchAll(customUserDetails.getUsername(), searchVM), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/get_with_pagination")
    public ResponseEntity<CustomResponse> getAllWithPagination(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get OptimaLeaveTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.getAllWithPagination(customUserDetails.getUsername(), searchVM, pageable), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody OptimaLeaveTrackerVM optimaLeaveTrackerVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Updating OptimaLeaveTracker Details using id" + id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_UPDATED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_UPDATED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_UPDATED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.update(id, optimaLeaveTrackerVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/download")
    public ResponseEntity<CustomResponse> download(@RequestBody OptimaLeaveTrackerVM optimaLeaveTrackerVm,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Downloading OptimaLeaveTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_DOWNLOADED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_DOWNLOADED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_DOWNLOADED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.download(optimaLeaveTrackerVm, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping("/get_parameter_list")
    public AdvanceSearchList getParameterList(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Fetching OptimaLeaveTracker parameter list Details");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return (AdvanceSearchList) optimaLeaveTrackerService.getParamterList(customUserDetails);
    }

    @PutMapping(value = "/advance_search")
    public ResponseEntity<CustomResponse> advanceSearch(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Advanced search for OptimaLeaveTracker Details");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.advanceSearch(searchVM, pageable, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Deleting OptimaLeaveTracker Details using id"+id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_DELETED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_DELETED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_DELETED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.delete(id, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/dashboard")
    public ResponseEntity<CustomResponse> dashboard(@RequestBody OptimaLeaveTrackerVM optimaLeaveTrackerVm, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_LEAVE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaLeaveTrackerService.dashboard(optimaLeaveTrackerVm, customUserDetails), metaInfo),
                HttpStatus.OK);
    }
}