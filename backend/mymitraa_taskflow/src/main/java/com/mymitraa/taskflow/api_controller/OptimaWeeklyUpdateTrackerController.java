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
import com.mymitraa.taskflow.api_service.OptimaWeeklyUpdateTrackerService;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_successcode.SuccessCode;
import com.mymitraa.taskflow.api_vm.DocumentUploadVM;
import com.mymitraa.taskflow.api_vm.MailRequestVM;
import com.mymitraa.taskflow.api_vm.OptimaWeeklyUpdateTrackerVM;
import com.mymitraa.taskflow.api_vm.SearchVM;
import com.mymitraa.taskflow.config.Constants;
import com.mymitraa.taskflow.security.CustomUserDetails;

@RestController
@RequestMapping("/api/optima_weekly_update_tracker")
public class OptimaWeeklyUpdateTrackerController {
    private static final Logger log = LoggerFactory.getLogger(OptimaWeeklyUpdateTrackerController.class);

    @Autowired
    private OptimaWeeklyUpdateTrackerService optimaWeeklyUpdateTrackerService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@ModelAttribute OptimaWeeklyUpdateTrackerVM optimaWeeklyUpdateTrackerVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("OptimaWeeklyUpdateTracker data saving");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DATA_SAVED_SUCCESS.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DATA_SAVED_SUCCESS.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DATA_SAVED_SUCCESS.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.save(optimaWeeklyUpdateTrackerVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get data of OptimaWeeklyUpdateTracker using OptimaWeeklyUpdateTracker id" + id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.getById(id, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody SearchVM searchVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get OptimaWeeklyUpdateTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.fetchAll(customUserDetails.getUsername(), searchVM), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/get_with_pagination")
    public ResponseEntity<CustomResponse> getAllWithPagination(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get OptimaWeeklyUpdateTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.getAllWithPagination(customUserDetails.getUsername(), searchVM, pageable), metaInfo),
                HttpStatus.OK);
    }

    @PostMapping(value = "/update")
    public ResponseEntity<CustomResponse> update(@ModelAttribute OptimaWeeklyUpdateTrackerVM optimaWeeklyUpdateTrackerVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Updating OptimaWeeklyUpdateTracker Details using id");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME,
                SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_UPDATED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_UPDATED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_UPDATED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.update(optimaWeeklyUpdateTrackerVM, customUserDetails),
                        metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/download")
    public ResponseEntity<CustomResponse> download(@RequestBody OptimaWeeklyUpdateTrackerVM optimaWeeklyUpdateTrackerVm,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Downloading OptimaWeeklyUpdateTracker Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DOWNLOADED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DOWNLOADED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DOWNLOADED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.download(optimaWeeklyUpdateTrackerVm, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping("/get_parameter_list")
    public AdvanceSearchList getParameterList(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Fetching OptimaWeeklyUpdateTracker parameter list Details");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return optimaWeeklyUpdateTrackerService.getParamterList(customUserDetails);
    }

    @PutMapping(value = "/advance_search")
    public ResponseEntity<CustomResponse> advanceSearch(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Advanced search for OptimaWeeklyUpdateTracker Details");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.advanceSearch(searchVM, pageable, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Deleting OptimaWeeklyUpdateTracker Details using id"+id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DELETED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DELETED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_DELETED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.delete(id, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/dashboard")
    public ResponseEntity<CustomResponse> dashboard(@RequestBody OptimaWeeklyUpdateTrackerVM optimaWeeklyUpdateTrackerVm, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.dashboard(optimaWeeklyUpdateTrackerVm, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PostMapping(value = "/uploadfile/{id}")
    public ResponseEntity<CustomResponse> uploadDocuments(@PathVariable("id") String id,
            @ModelAttribute DocumentUploadVM documentVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.GLOBAL_FILE_UPLOADED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.GLOBAL_FILE_UPLOADED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.GLOBAL_FILE_UPLOADED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.uploadDocuments(id, documentVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping("/get_fetch_all/{projectName}")
    public ResponseEntity<CustomResponse> getFetchAll(@PathVariable String projectName) {
        log.info("Get Default Project Config for project: " + projectName);

        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME,
                SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_UPDATE_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.getFetchAll(projectName), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping("/send-weekly-mail")
    public ResponseEntity<CustomResponse> sendWeeklyMail(@RequestBody MailRequestVM mailRequestVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Sending weekly report mail for user: " + customUserDetails.getUsername());

        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.OPTIMA_WEEKLY_REPORT_MAIL_SENT_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.OPTIMA_WEEKLY_REPORT_MAIL_SENT_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.OPTIMA_WEEKLY_REPORT_MAIL_SENT_SUCCESSFULLY.getSuccessMessage(),
                        optimaWeeklyUpdateTrackerService.sendWeeklyMail(mailRequestVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

}