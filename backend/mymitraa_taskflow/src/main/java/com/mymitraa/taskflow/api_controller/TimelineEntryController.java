package com.mymitraa.taskflow.api_controller;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_domain.TimelineEntry;
import com.mymitraa.taskflow.api_service.TimelineEntryService;

@RestController
@RequestMapping("/api/timeline")
public class TimelineEntryController {
    private static final Logger log = LoggerFactory.getLogger(TimelineEntryController.class);

    @Autowired
    private TimelineEntryService timelineEntryService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody TimelineEntry timelineEntry) {

        log.info("Timeline entry saving");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TIMELINE_ENTRY_SAVED_SUCCESS");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TIMELINE_ENTRY_SAVED_SUCCESS",
                        "Timeline entry saved successfully",
                        timelineEntryService.save(timelineEntry), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id) {

        log.info("get timeline entry by id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TIMELINE_ENTRY_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TIMELINE_ENTRY_FETCHED_SUCCESSFULLY",
                        "Timeline entry fetched successfully",
                        timelineEntryService.getById(id), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody Object searchVM) {

        log.info("get timeline entries");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TIMELINE_ENTRIES_FETCHED_SUCCESSFULLY");

        Pageable pageable = searchVM instanceof Pageable ? (Pageable) searchVM : null;
        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TIMELINE_ENTRIES_FETCHED_SUCCESSFULLY",
                        "Timeline entries fetched successfully",
                        timelineEntryService.fetchAll(pageable), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody TimelineEntry timelineEntry) {

        log.info("updating timeline entry with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TIMELINE_ENTRY_UPDATED_SUCCESSFULLY");

        timelineEntry.setId(id);
        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TIMELINE_ENTRY_UPDATED_SUCCESSFULLY",
                        "Timeline entry updated successfully",
                        timelineEntryService.update(timelineEntry), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id) {

        log.info("deleting timeline entry with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TIMELINE_ENTRY_DELETED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TIMELINE_ENTRY_DELETED_SUCCESSFULLY",
                        "Timeline entry deleted successfully",
                        timelineEntryService.delete(id), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/by-entity/{entityType}/{entityId}")
    public ResponseEntity<CustomResponse> fetchByEntity(
            @PathVariable("entityType") String entityType,
            @PathVariable("entityId") String entityId) {

        log.info("get timeline entries by entity: {} / {}", entityType, entityId);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TIMELINE_ENTRIES_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TIMELINE_ENTRIES_FETCHED_SUCCESSFULLY",
                        "Timeline entries fetched by entity",
                        timelineEntryService.fetchByRelatedEntity(entityType, entityId), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/by-date-range")
    public ResponseEntity<CustomResponse> fetchByDateRange(
            @RequestParam("start") String start,
            @RequestParam("end") String end) {

        log.info("get timeline entries by date range: {} to {}", start, end);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "TIMELINE_ENTRIES_FETCHED_SUCCESSFULLY");

        Date startDate = parseDate(start);
        Date endDate = parseDate(end);

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("TIMELINE_ENTRIES_FETCHED_SUCCESSFULLY",
                        "Timeline entries fetched by date range",
                        timelineEntryService.fetchByDateRange(startDate, endDate), metaInfo),
                HttpStatus.OK);
    }

    private static Date parseDate(String s) {
        if (s == null || s.trim().isEmpty()) return new Date();
        try {
            return new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH).parse(s.trim());
        } catch (Exception e) {
            return new Date();
        }
    }
}