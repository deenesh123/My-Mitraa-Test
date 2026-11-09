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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_successcode.SuccessCode;
import com.mymitraa.taskflow.config.Constants;
import com.mymitraa.taskflow.security.CustomUserDetails;
import com.mymitraa.taskflow.api_domain.AdvanceSearchList;
import com.mymitraa.taskflow.api_service.DropdownManagementService;
import com.mymitraa.taskflow.api_vm.DropdownManagementVM;
import com.mymitraa.taskflow.api_domain.DropdownManagement;

@RestController
@RequestMapping("/api/dropdown_management")
public class DropdownManagementController {
    private static final Logger log = LoggerFactory.getLogger(DropdownManagementController.class);

    @Autowired
    private DropdownManagementService dropdownManagementService;

    @PostMapping(value = "/save")
    public ResponseEntity<CustomResponse> save(@RequestBody DropdownManagement dropdownManagement,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("DropdownManagement data saving");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DROPDOWN_MANAGEMENT_DATA_SAVED_SUCCESS.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DROPDOWN_MANAGEMENT_DATA_SAVED_SUCCESS.getSuccessCode(),
                        SuccessCode.DROPDOWN_MANAGEMENT_DATA_SAVED_SUCCESS.getSuccessMessage(),
                        dropdownManagementService.save(dropdownManagement, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get data of DropdownManagement using DropdownManagement id" + id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        dropdownManagementService.getById(id, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody Object searchVM, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get DropdownManagement Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        dropdownManagementService.fetchAll(customUserDetails.getUsername(), searchVM), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/get_with_pagination")
    public ResponseEntity<CustomResponse> getAllWithPagination(@RequestBody Object searchVM, Pageable pageable, @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("get DropdownManagement Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getSuccessMessage(),
                        dropdownManagementService.getAllWithPagination(customUserDetails.getUsername(), searchVM, pageable), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody DropdownManagementVM dropdownManagementVM,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {

        log.info("Updating DropdownManagement Details using id" + id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DROPDOWN_MANAGEMENT_UPDATED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DROPDOWN_MANAGEMENT_UPDATED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DROPDOWN_MANAGEMENT_UPDATED_SUCCESSFULLY.getSuccessMessage(),
                        dropdownManagementService.update(id, dropdownManagementVM, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/download")
    public ResponseEntity<CustomResponse> download(@RequestBody DropdownManagementVM dropdownManagementVm,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestHeader("Authorization") String token) {

        log.info("Downloading DropdownManagement Details");
        HashMap<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DROPDOWN_MANAGEMENT_DOWNLOADED_SUCCESSFULLY.getServiceName());

        return new ResponseEntity<CustomResponse>(
                new CustomResponse(SuccessCode.DROPDOWN_MANAGEMENT_DOWNLOADED_SUCCESSFULLY.getSuccessCode(),
                        SuccessCode.DROPDOWN_MANAGEMENT_DOWNLOADED_SUCCESSFULLY.getSuccessMessage(),
                        dropdownManagementService.download(dropdownManagementVm, customUserDetails), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping("/get_parameter_list")
    public AdvanceSearchList getParameterList( @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                   @RequestHeader("Authorization") String token) {

        log.info("Fetching DropdownManagement parameter list Details");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put(Constants.SERVICE_NAME, SuccessCode.DROPDOWN_MANAGEMENT_FETCHED_SUCCESSFULLY.getServiceName());

        return dropdownManagementService.getParamterList(customUserDetails);
    }
}