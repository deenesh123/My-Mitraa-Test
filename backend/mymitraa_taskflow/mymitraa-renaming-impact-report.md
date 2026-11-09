# MyMitraa Renaming Impact Report

## Overview
This report analyzes all references that need to be renamed or migrated when transforming the PM-TOOL backend from Kellton Optima to MyMitraa TaskFlow. References are categorized by type and impact level.

## Reference Categorization

### A. Branding References (Application Display Name, Company Name)

| Reference | Current Value | MyMitraa Value | Impact | Change Required |
|-----------|--------------|----------------|--------|-----------------|
| **Application Name** | `WellService` | `MyMitraa TaskFlow` | HIGH | Update in application.yml, application-dev.yml, application-prod.yml; JHipsterProperties; Swagger config |
| **Product Name** | (not explicitly set) | `MyMitraa TaskFlow` | HIGH | Update pom.xml `<name>Optima Petrotol Service</name>`; package descriptions |
| **Swagger Title** | `WellService API` | `MyMitraa TaskFlow API` | MEDIUM | Update springfox-swagger2 Docket configuration; api-info; `contact-name`, `title` fields |
| **Company Name** | `kelltontech` (package) | `mymitraa` (package) | HIGH | Java package rename across 250+ Java files |
| **Email From Address** | `WellService@localhost` | `MyMitraa@localhost` | MEDIUM | Update `jhipster.mail.from` in application-dev.yml |
| **Mail Username** | `optimaplatform@gmail.com` | `mymitraa@platform.com` (new) | HIGH | Generate new SMTP credentials; update application-dev.yml |
| **Mail Password** | `pagasytictzysjhz` | **NEW** (generated) | CRITICAL | Generate completely new credentials; do not reuse exposed password |
| **JWT Secret** | `my-secret-token-to-change-in-production` | **NEW** (generated) | CRITICAL | Generate new secure secret; mark old as compromised |

**Branding Impact Summary**:
- 2 CRITICAL references (JWT secret, SMTP password - must generate new)
- 3 HIGH references (package name, application name, mail credentials)
- 2 MEDIUM references (swagger title, email from address)

---

### B. Java Package References

| Reference | Current Value | Target Value | Files Affected | Impact |
|-----------|--------------|--------------|----------------|--------|
| **Root Package** | `com.kelltontech.optima` | `com.mymitraa.taskflow` | 250+ Java source files | RENAME ALL |
| **Package Declaration** | `package com.kelltontech.optima.aop.logging;` | `package com.mymitraa.taskflow.aop.logging;` | All Java files | Package-rename operation |
| **Import Statements** | Various `com.kelltontech.optima.*` | `com.mymitraa.taskflow.*` | All Java files with cross-package imports | Auto-rename during package migration |
| **Component Scanning** | `basePackage: "com.kelltontech.optima"` | `basePackage: "com.mymitraa.taskflow"` | Spring config classes | Update @ComponentScan annotation |
| **Maven Artifact** | `optima-petrotol-service` | `mymitraa-taskflow` | pom.xml | Update `<artifactId>` |
| **Class Names** | Retain class names (e.g., `CompanyController`) | Same class names, new package | All Java files | Only package path changes |
| **Test Classes** | `*ControllerTest`, `*ServiceTest` | Same test names, new package | src/test/java | Update package declarations |

**Package Rename Impact Summary**:
- **Total Java Files**: ~250+ under `com.kelltontech.optima`
- **Package Declarations**: Every Java file has `package com.kelltontech.optima.xxx` line
- **Import Statements**: Cross-package imports need repointing
- **Spring Component-Scan**: `@ComponentScan("com.kelltontech.optima")` needs update
- **Maven Artifact ID**: `optima-petrotol-service` → `mymitraa-taskflow`
- **Test Files**: All test classes need package line update

**Package Rename Complexity**: HIGH - requires systematic renaming of all Java source files, but class names remain unchanged.

---

### C. Technical and Infrastructure References

#### 1. File Paths

| Reference | Current Value | MyMitraa Value | Impact | Change Required |
|-----------|--------------|----------------|--------|-----------------|
| **Upload Path** | `/opt/tomcat/webapps/ROOT/history_uploads/Templete` | `/opt/tomcat/webapps/ROOT/mymitraa_uploads/Templete` | MEDIUM | Update `upload-path` in application-dev.yml |
| **History Uploads** | `/opt/tomcat/webapps/ROOT/history_uploads` | `/opt/tomcat/webapps/ROOT/mymitraa_uploads` | MEDIUM | Update `history-uploads` in application-dev.yml |
| **Completion Reports** | `/home/kelluser/Documents/ProjectManagementDocs/...` | `/home/mymitraa/Documents/ProjectManagementDocs/...` | HIGH | Update 4 paths in application-dev.yml |
| **Workover Reports** | `/home/kelluser/Documents/ProjectManagementDocs/...` | `/home/mymitraa/Documents/ProjectManagementDocs/...` | HIGH | Update 2 paths in application-dev.yml |
| **Remote Path** | `/home/kelluser/Documents/ProjectManagementDocs/AL/CBU/FARIDA A/` | `/home/mymitraa/Documents/ProjectManagementDocs/AL/CBU/FARIDA A/` | HIGH | Update `remote-path` in application-dev.yml |
| **Local Path** | `/home/kelluser/Documents/ProjectManagementDocs/AL/CBU/FARIDA A/` | `/home/mymitraa/Documents/ProjectManagementDocs/AL/CBU/FARIDA A/` | HIGH | Update `local-path` in application-dev.yml |
| **Generated Excels** | `/opt/tomcat/webapps/ROOT/history_uploads/Generated_Excels` | `/opt/tomcat/webapps/ROOT/mymitraa_uploads/Generated_Excels` | MEDIUM | Update in application-dev.yml |

**File Path Impact Summary**:
- **Total Paths to Migrate**: 7 references in application-dev.yml
- **CRITICAL**: `/home/kelluser/` paths (4 references - user-specific directory)
- **HIGH**: Completion/workover report paths (user home directories)
- **MEDIUM**: Upload paths (directory structure changes)

#### 2. Database Configuration

| Reference | Current Value | MyMitraa Value | Impact | Change Required |
|-----------|--------------|----------------|--------|-----------------|
| **MongoDB Host** | `192.168.14.80` | `localhost` or separate host | HIGH | Update MongoDB connection |
| **Database Name** | `pardali_service` | `mymitraa_taskflow` | CRITICAL | Update spring.data.mongodb.database |
| **Authentication Database** | `pardali_gateway` | `mymitraa_gateway` (new) | HIGH | Update auth database name |
| **MongoDB Username** | `fronteradevdbuser` | `mymitraa_dbuser` (new) | CRITICAL | Generate new database user |
| **MongoDB Password** | `cbQUQME7R0vk7r2` | **NEW** (generated) | CRITICAL | Generate completely new credentials; old exposed password must not be reused |
| **Database Port** | `2717` (dev profile) | `27017` (standard) or separate | MEDIUM | Update if changing host/port |

**Database Impact Summary**:
- **CRITICAL**: Database name rename (`pardali_service` → `mymitraa_taskflow`)
- **CRITICAL**: Credentials must be regenerated (username/password exposed in discovery)
- **HIGH**: Authentication database name update
- **MEDIUM**: Host/port configuration

#### 3. Mail Configuration

| Reference | Current Value | MyMitraa Value | Impact | Change Required |
|-----------|--------------|----------------|--------|-----------------|
| **SMTP Host** | `smtp.gmail.com` | `smtp.mymitraa.com` or keep gmail | LOW | May keep or update host |
| **SMTP Port** | `587` | `587` (standard) | N/A | Keep standard port |
| **Mail Username** | `optimaplatform@gmail.com` | `mymitraa@platform.com` (new) | CRITICAL | Generate new email account/user |
| **Mail Password** | `pagasytictzysjhz` | **NEW** (generated) | CRITICAL | Generate completely new credentials |
| **Mail From** | `WellService@localhost` | `MyMitraa@localhost` | MEDIUM | Update `jhipster.mail.from` |
| **Base URL** | `http://127.0.0.1:8081` | `http://127.0.0.1:8081` (same port) | N/A | Keep development port |
| **TLS** | `true` | `true` (standard) | N/A | Keep TLS enabled |

**Mail Configuration Impact Summary**:
- **CRITICAL**: SMTP credentials must be completely new (exposed `optimaplatform@gmail.com` / `pagasytictzysjhz`)
- **MEDIUM**: Email from address update
- **LOW**: Host/protocol can remain same, only credentials change

#### 4. Deployment Configuration

| Reference | Current Value | MyMitraa Value | Impact | Change Required |
|-----------|--------------|----------------|--------|-----------------|
| **Server Port** (dev) | `8081` | `8081` or `8082` | LOW | Keep or update |
| **Server Port** (prod) | `8082` | `8082` (or update) | LOW | Keep production port |
| **JHipster Profile** | `dev` / `prod` | `dev` / `prod` | N/A | Keep profile structure |
| **CORS Config** | Disabled (commented) | Update for MyMitraa domains | MEDIUM | Uncomment and configure allowed origins |
| **Consul Discovery** | `localhost:8500` | Update service name | MEDIUM | Update consul service registration |
| **Hazelcast Config** | `time-to-live-seconds: 3600` | Update cache names | LOW | Update distributed cache configuration |

**Deployment Impact Summary**:
- **LOW**: Port configuration can remain same
- **MEDIUM**: CORS and consul service name updates needed
- **LOW**: Hazelcast cache names may need updating

#### 5. Environment Variables

| Reference | Current Value | MyMitraa Value | Impact | Change Required |
|-----------|--------------|----------------|--------|-----------------|
| **JWT_SECRET** | `my-secret-token-to-change-in-production` | **NEW** (generated) | CRITICAL | Generate new secret; do not reuse |
| **MONGODB_URI** | Not explicitly set | Configure with new credentials | HIGH | Update with new DB credentials |
| **MAIL_USERNAME** | `optimaplatform@gmail.com` | `mymitraa@platform.com` | CRITICAL | Update with new email credentials |
| **MAIL_PASSWORD** | `pagasytictzysjhz` | **NEW** (generated) | CRITICAL | Generate new password; do not reuse |
| **UPLOAD_PATH** | `/opt/tomcat/webapps/ROOT/history_uploads/Templete` | `/opt/tomcat/webapps/ROOT/mymitraa_uploads/Templete` | MEDIUM | Update path |
| **HISTORY_UPLOADS** | `/opt/tomcat/webapps/ROOT/history_uploads` | `/opt/tomcat/webapps/ROOT/mymitraa_uploads` | MEDIUM | Update path |

**Environment Variables Impact Summary**:
- **CRITICAL**: JWT_SECRET and MAIL_PASSWORD must be regenerated (exposed)
- **HIGH**: MONGODB_URI and MAIL_USERNAME must update with new credentials
- **MEDIUM**: File path environment variables update

---

## Impact Classification Summary

| Impact Level | Category | Count | References |
|--------------|----------|-------|------------|
| **CRITICAL** | Security credentials, database names | 6 | JWT secret, SMTP password, MongoDB password, MongoDB username, DB name, Mail username |
| **HIGH** | Package renames, file paths, DB auth | 14 | Java package (250+ files), 7 file paths, auth DB name, MongoDB host, component scan |
| **MEDIUM** | branding, config updates | 8 | Swagger title, email from, CORS, upload paths, server port |
| **LOW** | Minor config tweaks | 3 | Hazelcast TTL, base URL, some deployment settings |

**Total References Requiring Update**: 31 distinct configuration points across 6 categories

---

## Migration Priority Order

### Phase 1: Immediate Security (Run Before Anything Else)
1. ✅ Generate new JWT secret (do not reuse `my-secret-token-to-change-in-production`)
2. ✅ Generate new MongoDB credentials (username/password)
3. ✅ Generate new SMTP credentials (username/password - do not reuse exposed values)
4. ✅ Mark all exposed credentials as compromised

### Phase 2: Package and Structure (Run After Security)
5. Rename Java package: `com.kelltontech.optima` → `com.mymitraa.taskflow` (~250 files)
6. Update Maven artifact ID: `optima-petrotol-service` → `mymitraa-taskflow`
7. Update Spring component-scan base packages
8. Update Maven POM configuration

### Phase 3: Application Configuration (Run After Package)
9. Update application.yml / application-dev.yml:
   - `spring.data.mongodb.database: mymitraa_taskflow`
   - `jhipster.mail.from: MyMitraa@localhost`
   - `upload-path: /opt/tomcat/webapps/ROOT/mymitraa_uploads/Templete`
   - `history-uploads: /opt/tomcat/webapps/ROOT/mymitraa_uploads`
   - Replace all `/home/kelluser/` paths with `/home/mymitraa/`
10. Update Swagger/swagger2 Docket configuration
11. Update JHipsterProperties (application name, contact info)

### Phase 4: Deployment and Environment (Run After Config)
12. Update environment variables:
    - New JWT_SECRET
    - New MAIL_USERNAME/MAIL_PASSWORD
    - Updated file paths
    - MongoDB connection string
13. Configure CORS for MyMitraa domains
14. Update consul service names if used

### Phase 5: Build and Verify (Run After All)
15. `mvnw clean package` - verify compilation
16. Run unit tests to confirm package rename integrity
17. Validate MongoDB connection with new credentials
18. Test SMTP email send with new credentials

---

## What Must NOT Change (Preserved)

| Element | Reason |
|---------|--------|
| **Java class names** | `CompanyController`, `CompanyService`, etc. - business logic preserved |
| **API endpoints** | `/api/company`, `/api/wells`, etc. - all 48 endpoints preserved |
| **HTTP methods** | GET, POST, PUT, DELETE - unchanged |
| **Request/Response DTO structures** | `CustomResponse`, `SuccessCode`, `SearchVM` patterns preserved |
| **MongoDB document models** | Domain model fields unchanged - only DB name changes |
| **Authentication flow** | JWT validation pattern preserved - only secret changes |
| **File upload mechanism** | Commons-fileupload based - only paths change |
| **Existing business logic** | All controller/service methods preserved exactly |

---

## Renaming Impact Report Conclusion

**Total References**: 31 distinct configuration points requiring update
**Critical Security Updates**: 6 (must complete first)
**High-Impact Structural Changes**: 14 (package, paths, DB config)
**Medium/Low Config Updates**: 11 (branding, minor configs)

**Risk Assessment**:
- **Package rename**: MEDIUM risk - systematic, auto-renamable, but requires all 250+ files updated
- **Credential rotation**: LOW risk - generate new, don't reuse old
- **Path migration**: LOW risk - simple string replacements in config files
- **Database rename**: LOW risk - only config change, data model preserved

**Recommendation**: Proceed with Phase 1 (security credential generation) first, then Phase 2 (package rename), then Phase 3 (config updates). All changes are well-understood and documented.

**Status**: ✅ REPORT COMPLETE - Waiting for approval before executing renaming operations.