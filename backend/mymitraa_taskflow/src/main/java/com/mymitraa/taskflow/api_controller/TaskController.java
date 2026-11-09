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
import com.mymitraa.taskflow.api_domain.Task;
import com.mymitraa.taskflow.api_repository.TaskRepository;
import com.mymitraa.taskflow.api_service.TaskService;
import com.mymitraa.taskflow.api_vm.TaskVM;
import com.mymitraa.taskflow.security.CustomUserDetails;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private TaskService taskService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody Task task,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Task saving");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TASK_SAVED_SUCCESS");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TASK_SAVED_SUCCESS",
                        "Task saved successfully",
                        taskService.save(task, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get task by id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TASK_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TASK_FETCHED_SUCCESSFULLY",
                        "Task fetched successfully",
                        taskService.getById(id), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody Object searchVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get tasks");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TASKS_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TASKS_FETCHED_SUCCESSFULLY",
                        "Tasks fetched successfully",
                        taskService.fetchAll(customUserDetails.getUsername(), (Pageable) searchVM), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody Task task,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("updating task with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TASK_UPDATED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TASK_UPDATED_SUCCESSFULLY",
                        "Task updated successfully",
                        taskService.update(task, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("deleting task with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TASK_DELETED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TASK_DELETED_SUCCESSFULLY",
                        "Task deleted successfully",
                        taskService.delete(id), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/owner-email/{id}")
    public ResponseEntity<CustomResponse> getTaskOwnerEmail(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get task owner email for id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TASK_OWNER_EMAIL_SENT");

        Object result = taskService.getTaskOwnerEmail(id);

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TASK_OWNER_EMAIL_SENT",
                        "Task owner email processed",
                        result, metaInfo),
                HttpStatus.OK);
    }
}