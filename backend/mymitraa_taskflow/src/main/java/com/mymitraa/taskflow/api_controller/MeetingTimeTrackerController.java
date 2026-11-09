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
import com.mymitraa.taskflow.api_domain.MeetingTimeTracker;
import com.mymitraa.taskflow.api_service.MeetingTimeTrackerService;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_successcode.SuccessCode;
import com.mymitraa.taskflow.api_vm.MeetingTimeTrackerVM;
import com.mymitraa.taskflow.api_vm.SearchVM;
import com.mymitraa.taskflow.config.Constants;
import com.mymitraa.taskflow.security.CustomUserDetails;

@RestController
@RequestMapping("/api/meeting_time_tracker")
public class MeetingTimeTrackerController {
    private static final Logger log = LoggerFactory.getLogger(MeetingTimeTrackerController.class);

    @Autowired
    private MeetingTimeTrackerService meetingTimeTrackerService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody MeetingTimeTracker meetingTimeTracker,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("MeetingTimeTracker data saving");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_DATA_SAVED_SUCCESS.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_DATA_SAVED_SUCCESS.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_DATA_SAVED_SUCCESS.getSuccessMessage(),
                        meetingTimeTrackerService.save(meetingTimeTracker, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get data of MeetingTimeTracker using MeetingTimeTracker id" + id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.getById(id, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody SearchVM searchVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get MeetingTimeTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.fetchAll(customUserDetails.getUsername(), searchVM), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/get_with_pagination")
    public ResponseEntity<CustomResponse> getAllWithPagination(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get MeetingTimeTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.getAllWithPagination(customUserDetails.getUsername(), searchVM, pageable), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody MeetingTimeTrackerVM meetingTimeTrackerVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Updating MeetingTimeTracker Details using id" + id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_UPDATED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_UPDATED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_UPDATED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.update(id, meetingTimeTrackerVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/download")
    public ResponseEntity<CustomResponse> download(@RequestBody MeetingTimeTrackerVM meetingTimeTrackerVm,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Downloading MeetingTimeTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_DOWNLOADED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_DOWNLOADED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_DOWNLOADED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.download(meetingTimeTrackerVm, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping("/get_parameter_list")
    public AdvanceSearchList getParameterList(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Fetching MeetingTimeTracker parameter list Details");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return meetingTimeTrackerService.getParamterList(customUserDetails);
    }

    @PutMapping(value = "/advance_search")
    public ResponseEntity<CustomResponse> advanceSearch(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Advanced search for MeetingTimeTracker Details");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.advanceSearch(searchVM, pageable, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Deleting MeetingTimeTracker Details using id"+id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_DELETED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_DELETED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_DELETED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.delete(id, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/dashboard")
    public ResponseEntity<CustomResponse> dashboard(@RequestBody MeetingTimeTrackerVM meetingTimeTrackerVm, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.MEETING_TIME_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        meetingTimeTrackerService.dashboard(meetingTimeTrackerVm, customUserDetails), metaInfo),
                HttpStatus.OK);
    }
}