package com.mymitraa.taskflow.api_controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mymitraa.taskflow.api_domain.AdvanceSearchList;
import com.mymitraa.taskflow.api_domain.FeedbackHistory;
import com.mymitraa.taskflow.api_domain.WorkLogEntry;
import com.mymitraa.taskflow.api_service.FeedbackHistoryService;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_successcode.SuccessCode;
import com.mymitraa.taskflow.api_vm.AssignTaskVM;
import com.mymitraa.taskflow.api_vm.EpicVM;
import com.mymitraa.taskflow.api_vm.EffortRecordVM;
import com.mymitraa.taskflow.api_vm.FeedbackHistoryVM;
import com.mymitraa.taskflow.api_vm.SearchVM;
import com.mymitraa.taskflow.config.Constants;
import com.mymitraa.taskflow.security.CustomUserDetails;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackHistoryController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FeedbackHistoryController.class);

    @Autowired
    private FeedbackHistoryService feedbackHistoryService;

    @PostMapping("/save_feedback")
    public ResponseEntity<CustomResponse> saveFeedback(@ModelAttribute FeedbackHistoryVM feedbackHistoryVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getServiceName());
        FeedbackHistory savedFeedback = feedbackHistoryService.saveFeedback(feedbackHistoryVM, customUserDetails);
        return new ResponseEntity<CustomResponse>(new CustomResponse(SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getSuccessMessage(), savedFeedback, metaInfo), HttpStatus.OK);
    }

    @PostMapping("/edit_feedback")
    public ResponseEntity<CustomResponse> editFeedback(@ModelAttribute FeedbackHistoryVM feedbackHistoryVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getServiceName());
        FeedbackHistory savedFeedback = feedbackHistoryService.editFeedback(feedbackHistoryVM, customUserDetails);
        return new ResponseEntity<>(new CustomResponse(SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getSuccessMessage(), savedFeedback, metaInfo), HttpStatus.OK);
    }

    @PutMapping("/get_all_feedback")
    public ResponseEntity<CustomResponse> getFeedback(@RequestBody SearchVM searchVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails, Pageable pageable) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(new CustomResponse(SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                feedbackHistoryService.getAllFeedback(searchVM, pageable), metaInfo), HttpStatus.OK);
    }

    @GetMapping("/get_feedback_by_id/{feedback_id}")
    public ResponseEntity<CustomResponse> getFeedbackById(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @PathVariable("feedback_id") String feedbackId) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<>(new CustomResponse(SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                feedbackHistoryService.getFeedbackById(feedbackId), metaInfo), HttpStatus.OK);
    }

    @DeleteMapping("/get_feedback_by_id/{feedback_id}")
    public ResponseEntity<CustomResponse> deleteFeedbackById(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @PathVariable("feedback_id") String feedbackId) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.deleteFeedbackById(feedbackId), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping("/feedback_numerical_count")
    public ResponseEntity<CustomResponse> getFeedbackNumericalCount(
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<>(new CustomResponse(SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                feedbackHistoryService.getFeedbackNumericalCount(), metaInfo), HttpStatus.OK);
    }

    @GetMapping("/get_parameter_list")
    public AdvanceSearchList getParameterList(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return (AdvanceSearchList) feedbackHistoryService.getParamterList(customUserDetails);
    }

    @PutMapping(value = "/advance_search")
    public ResponseEntity<CustomResponse> advanceSearch(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.advanceSearch(searchVM, pageable, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/subtask_advance_search")
    public ResponseEntity<CustomResponse> subTaskAdvanceSearch(@RequestBody SearchVM searchVM, Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.subTaskAdvanceSearch(searchVM, pageable, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping("/get_searchable_subtask_fields")
    public ResponseEntity<CustomResponse> getSearchableSubtaskFields(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.getSearchableSubtaskFields(customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping("/delete_file/{ticketNumber}")
    public ResponseEntity<CustomResponse> deleteFile(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @PathVariable("ticketNumber") String ticketNumber) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.deleteFile(ticketNumber), metaInfo),
                HttpStatus.OK);
    }

    @PostMapping("/assign_task")
    public ResponseEntity<CustomResponse> assignTask(@RequestBody AssignTaskVM assignTaskVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.TASK_ASSIGNED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.TASK_ASSIGNED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.TASK_ASSIGNED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.assignTask(assignTaskVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PostMapping("/close_task")
    public ResponseEntity<CustomResponse> taskClosed(@RequestBody FeedbackHistoryVM feedbackHistoryVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.TASK_CLOSED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.TASK_CLOSED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.TASK_CLOSED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.taskClosed(feedbackHistoryVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PostMapping("/add_subtask")
    public ResponseEntity<CustomResponse> addSubTask(@ModelAttribute FeedbackHistoryVM feedbackHistoryVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.addSubTask(feedbackHistoryVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping("/update_subtask/{feedbackHistoryId}/{epicId}")
    public ResponseEntity<CustomResponse> updateSubTask(@ModelAttribute EpicVM epicVM,
            @PathVariable String feedbackHistoryId, @PathVariable String epicId,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.EDIT_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.updateSubTask(epicVM, feedbackHistoryId, epicId, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping("/delete_subtask/{feedbackHistoryId}/{epicId}")
    public ResponseEntity<CustomResponse> deleteSubTask(@PathVariable("feedbackHistoryId") String feedbackHistoryId,
            @PathVariable("epicId") String epicId, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DELETE_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.deleteSubTask(feedbackHistoryId, epicId, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping("/get_uploaded_files")
    public ResponseEntity<CustomResponse> getUploadedFiles(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody SearchVM dateRangeVM, Pageable pageable) {

        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.GLOBAL_FILE_FETCH_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(new CustomResponse(SuccessCode.GLOBAL_FILE_FETCH_SUCCESSFULLY.getSuccessCode(),
                SuccessCode.GLOBAL_FILE_FETCH_SUCCESSFULLY.getSuccessMessage(),
                feedbackHistoryService.getUploadedFiles(dateRangeVM, pageable), metaInfo), HttpStatus.OK);
    }

    @GetMapping("/get_all_ticket_numbers")
    public ResponseEntity<CustomResponse> getAllTicketNumbers(@AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.getAllTicketNumbers(customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/daily_task_tracker")
    public ResponseEntity<CustomResponse> getDailyTaskTracker(@RequestBody EffortRecordVM effortRecordVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.getDailyTaskTracker(effortRecordVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping("/dashboard")
    public ResponseEntity<CustomResponse> dashboard(@RequestBody EffortRecordVM effortRecordVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.dashboard(effortRecordVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping("/add_worklog_hours")
    public ResponseEntity<CustomResponse> addWorklogHours(@RequestParam String feedbackHistoryId,
            @RequestParam(required = false) String epicId, @RequestBody List<WorkLogEntry> workLogEntry,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DAILY_TASK_TRACKER_FETCHED_SUCCESSFULLY.getSuccessMessage(), feedbackHistoryService
                                .addWorklogHours(feedbackHistoryId, epicId, workLogEntry, customUserDetails),
                        metaInfo),
                HttpStatus.OK);
    }

    @PostMapping(value = "/upload")
    public ResponseEntity<CustomResponse> uploadFile(@RequestBody MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.uploadFile(file, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PostMapping(value = "/upload/{ticketNumber}")
    public ResponseEntity<CustomResponse> uploadFileByTicketNumber(@PathVariable("ticketNumber") String ticketNumber,
            @RequestBody MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.SAVE_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                        feedbackHistoryService.uploadFileByTicketNumber(ticketNumber, file, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping("/get_status_record")
    public ResponseEntity<CustomResponse> getRecord(@RequestBody SearchVM searchVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails, Pageable pageable) {
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getServiceName());
        return new ResponseEntity<CustomResponse>(new CustomResponse(SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessCode(),
                SuccessCode.GET_FEEDBACK_SUCCESSFULLY.getSuccessMessage(),
                feedbackHistoryService.getRecord(searchVM, pageable), metaInfo), HttpStatus.OK);
    }
}