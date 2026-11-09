package com.mymitraa.taskflow.api_controller;

import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mymitraa.taskflow.api_domain.TaskOwnerEmail;
import com.mymitraa.taskflow.api_service.TaskOwnerEmailService;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_successcode.SuccessCode;
import com.mymitraa.taskflow.config.Constants;
import com.mymitraa.taskflow.security.CustomUserDetails;

@RestController
@RequestMapping("/api/task_owner_email")
public class TaskOwnerEmailController {
    private static final Logger log = LoggerFactory.getLogger(TaskOwnerEmailController.class);

    @Autowired
    private TaskOwnerEmailService taskOwnerEmailService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody TaskOwnerEmail taskOwnerEmail,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("TaskOwnerEmail data saving");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.TASK_OWNER_EMAIL_DATA_SAVED_SUCCESS.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.TASK_OWNER_EMAIL_DATA_SAVED_SUCCESS.getSuccessCode(),
                        SuccessCode.TASK_OWNER_EMAIL_DATA_SAVED_SUCCESS.getSuccessMessage(),
                        taskOwnerEmailService.save(taskOwnerEmail, customUserDetails), metaInfo),
                HttpStatus.OK);
    }
}