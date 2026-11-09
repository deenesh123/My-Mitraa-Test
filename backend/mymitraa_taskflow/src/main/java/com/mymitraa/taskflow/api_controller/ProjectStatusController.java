package com.mymitraa.taskflow.api_controller;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_domain.ProjectStatus;
import com.mymitraa.taskflow.api_service.ProjectStatusService;

@RestController
@RequestMapping("/api/project_status")
public class ProjectStatusController {
    private static final Logger log = LoggerFactory.getLogger(ProjectStatusController.class);

    @Autowired
    private ProjectStatusService projectStatusService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody ProjectStatus projectStatus) {

        log.info("Project status saving");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "PROJECT_STATUS_SAVED_SUCCESS");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("PROJECT_STATUS_SAVED_SUCCESS",
                        "Project status saved successfully",
                        projectStatusService.save(projectStatus), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id) {

        log.info("get project status by id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "PROJECT_STATUS_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("PROJECT_STATUS_FETCHED_SUCCESSFULLY",
                        "Project status fetched successfully",
                        projectStatusService.getById(id), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody Object searchVM) {

        log.info("get project statuses");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "PROJECT_STATUSES_FETCHED_SUCCESSFULLY");

        Pageable pageable = searchVM instanceof Pageable ? (Pageable) searchVM : null;
        return new ResponseEntity<CustomResponse>(
                new CustomResponse("PROJECT_STATUSES_FETCHED_SUCCESSFULLY",
                        "Project statuses fetched successfully",
                        projectStatusService.fetchAll(pageable), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody ProjectStatus projectStatus) {

        log.info("updating project status with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "PROJECT_STATUS_UPDATED_SUCCESSFULLY");

        projectStatus.setId(id);
        return new ResponseEntity<CustomResponse>(
                new CustomResponse("PROJECT_STATUS_UPDATED_SUCCESSFULLY",
                        "Project status updated successfully",
                        projectStatusService.update(projectStatus), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id) {

        log.info("deleting project status with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "PROJECT_STATUS_DELETED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("PROJECT_STATUS_DELETED_SUCCESSFULLY",
                        "Project status deleted successfully",
                        projectStatusService.delete(id), metaInfo),
                HttpStatus.OK);
    }
}