package com.mymitraa.taskflow.api_controller;

import java.util.Date;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mymitraa.taskflow.api_successcode.CustomResponse;
import com.mymitraa.taskflow.api_domain.Document;
import com.mymitraa.taskflow.api_service.DocumentService;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    @Autowired
    private DocumentService documentService;

    @PostMapping(value = "/upload")
    public ResponseEntity<CustomResponse> upload(@RequestBody Document document,
            @RequestParam("file") MultipartFile file) {

        log.info("Document upload");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "DOCUMENT_UPLOADED_SUCCESS");

        // Set file properties
        document.setFilename(file.getOriginalFilename());
        document.setOriginalName(file.getOriginalFilename());
        document.setFileType(file.getContentType());
        document.setUploadDate(new Date());
        document.setStatus("UPLOADED");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("DOCUMENT_UPLOADED_SUCCESS",
                        "Document uploaded successfully",
                        documentService.save(document), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get/{id}")
    public ResponseEntity<CustomResponse> getById(@PathVariable("id") String id) {

        log.info("get document by id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "DOCUMENT_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("DOCUMENT_FETCHED_SUCCESSFULLY",
                        "Document fetched successfully",
                        documentService.getById(id), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/getAll")
    public ResponseEntity<CustomResponse> getAll(@RequestBody Object searchVM) {

        log.info("get documents");
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "DOCUMENTS_FETCHED_SUCCESSFULLY");

        Pageable pageable = searchVM instanceof Pageable ? (Pageable) searchVM : null;
        return new ResponseEntity<CustomResponse>(
                new CustomResponse("DOCUMENTS_FETCHED_SUCCESSFULLY",
                        "Documents fetched successfully",
                        documentService.fetchAll(pageable), metaInfo),
                HttpStatus.OK);
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<CustomResponse> update(@PathVariable("id") String id,
            @RequestBody Document document) {

        log.info("updating document with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "DOCUMENT_UPDATED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("DOCUMENT_UPDATED_SUCCESSFULLY",
                        "Document updated successfully",
                        documentService.update(document), metaInfo),
                HttpStatus.OK);
    }

    @DeleteMapping(value = "/delete/{id}")
    public ResponseEntity<CustomResponse> delete(@PathVariable("id") String id) {

        log.info("deleting document with id: {}", id);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "DOCUMENT_DELETED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("DOCUMENT_DELETED_SUCCESSFULLY",
                        "Document deleted successfully",
                        documentService.delete(id), metaInfo),
                HttpStatus.OK);
    }

    @GetMapping(value = "/get-by-filename/{filename}")
    public ResponseEntity<CustomResponse> getByFilename(@PathVariable("filename") String filename) {

        log.info("get document by filename: {}", filename);
        Map<String, String> metaInfo = new HashMap<>();
        metaInfo.put("SERVICE_NAME", "DOCUMENT_FETCHED_SUCCESSFULLY");

        return new ResponseEntity<CustomResponse>(
                new CustomResponse("DOCUMENT_FETCHED_SUCCESSFULLY",
                        "Document fetched by filename",
                        documentService.getDocument(filename), metaInfo),
                HttpStatus.OK);
    }
}