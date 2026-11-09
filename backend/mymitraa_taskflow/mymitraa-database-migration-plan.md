# MyMitraa Database Migration Plan

## Overview
This plan details the MongoDB database migration from the PM-TOOL backend's `pardali_service` database to the MyMitraa TaskFlow's `mymitraa_taskflow` database. All operations must preserve existing data and never modify the original PM-TOOL database.

## Current Database Configuration (PM-TOOL / Kellton Optima)

| Setting | Current Value | Source |
|---------|--------------|--------|
| **MongoDB Host** | `192.168.14.80` | application-dev.yml |
| **MongoDB Port** | `2717` (non-standard) | application-dev.yml |
| **Database Name** | `pardali_service` | application-dev.yml line 52 |
| **Authentication Database** | `pardali_gateway` | application-dev.yml line 55 |
| **Username** | `fronteradevdbuser` | application-dev.yml line 56 |
| **Password** | `cbQUQME7R0vk7r2` | application-dev.yml line 57 - **EXPOSED, MUST ROTATE** |
| **MongoDB Driver** | Spring Data MongoDB | pom.xml dependencies |
| **Object Mapping** | `@Document` annotations, Spring Data repos | Source code |

**Database Status**: Discovery-active. Credentials were exposed during analysis. **All new credentials must be generated.**

---

## Target Database Configuration (MyMitraa TaskFlow)

| Setting | Target Value | Priority | Notes |
|---------|--------------|----------|-------|
| **Database Name** | `mymitraa_taskflow` | CRITICAL | New database; never use `pardali_service` |
| **MongoDB Host** | `localhost` or separate secure host | HIGH | Can use localhost for development; separate host for production |
| **MongoDB Port** | `27017` (standard) | HIGH | Standard MongoDB port; change only if hosting separately |
| **Authentication Database** | `mymitraa_gateway` (new) | HIGH | New auth DB; never `pardali_gateway` |
| **Username** | `mymitraa_dbuser` (new) | CRITICAL | Generate new user; do not reuse `fronteradevdbuser` |
| **Password** | **NEW** (generated) | CRITICAL | Generate strong password; do not reuse `cbQUQME7R0v2` |
| **SSL/TLS** | `false` (dev) / `true` (prod option) | MEDIUM | Dev can use plain connection; prod should use TLS |
| **Maximum Pool Size** | JHipster default (typically 100) | LOW | Configure in Spring Data MongoDB |

---

## Migration Strategy

### Phase 1: Pre-Migration Preparation (Before Any Data Transfer)

#### 1. Generate New Credentials
- [ ] Create new MongoDB database user `mymitraa_dbuser` with strong password
- [ ] Create new authentication database `mymitraa_gateway`
- [ ] Grant appropriate roles: `readWrite` on `mymitraa_taskflow`
- [ ] Document new credentials securely (environment variables only)
- [ ] **Verify** old credentials `fronteradevdbuser`/`cbQUQME7R0vk7r2` are NOT used anywhere in new config

#### 2. provision New Database
- [ ] Create MongoDB database `mymitraa_taskflow` on target host
- [ ] Create authentication database `mymitraa_gateway`
- [ ] Create required collections (if not auto-created by Spring Data)
- [ ] Set up indexes matching PM-TOOL schema (see Indexes section below)
- [ ] **DO NOT** copy or migrate any existing data from `pardali_service`

#### 3. Backup Original (Verify-Only)
- [ ] Document original `pardali_service` database state (collection names, document counts)
- [ ] Create read-only backup verification for audit purposes
- [ ] **Never** modify original `pardali_service` database
- [ ] **Never** run migration commands against original database

---

### Phase 2: Configuration Migration

#### 1. Update application.yml / application-dev.yml

**Current (relevant excerpt)**:
```yaml
spring:
  data:
    mongodb:
      database: pardali_service
      host: 192.168.14.80
      authentication-database: pardali_gateway
      username: fronteradevdbuser
      password: cbQUQME7R0vk7r2
```

**Target**:
```yaml
spring:
  data:
    mongodb:
      database: mymitraa_taskflow
      host: localhost
      authentication-database: mymitraa_gateway
      username: mymitraa_dbuser
      password: ${MYMITRAA_MONGODB_PASSWORD}  # environment variable
```

**Changes Required**:
- `spring.data.mongodb.database: pardali_service` → `mymitraa_taskflow`
- `spring.data.mongodb.host: 192.168.14.80` → `localhost` (or new host)
- `spring.data.mongodb.authentication-database: pardali_gateway` → `mymitraa_gateway`
- `spring.data.mongodb.username: fronteradevdbuser` → `mymitraa_dbuser`
- `spring.data.mongodb.password: cbQUQME7R0vk7r2` → `${MYMITRAA_MONGODB_PASSWORD}` (env var)
- Remove hardcoded credentials; use environment variables

#### 2. Environment Variable Setup
```bash
# Required environment variables
export MYMITRAA_MONGODB_USERNAME=mymitraa_dbuser
export MYMITRAA_MONGODB_PASSWORD=<strong-generated-password>
export MYMITRAA_MONGODB_HOST=localhost
export MYMITRAA_MONGODB_PORT=27017
export MYMITRAA_MONGODB_AUTH_DATABASE=mymitraa_gateway
export MYMITRAA_MONGODB_DATABASE=mymitraa_taskflow
```

#### 3. Verify No Kellton References Remain
- [ ] Search all config files for `pardali_service`
- [ ] Search all config files for `fronteradevdbuser`
- [ ] Search all config files for `cbQUQME7R0vk7r2`
- [ ] Confirm all references replaced with MyMitraa equivalents

---

### Phase 3: Data Initialization (Optional - Not Required for Fresh Start)

**Note**: Since this is a new MyMitraa application, data initialization is optional. If starting fresh:

- [ ] Skip data migration from `pardali_service`
- [ ] Allow backend to initialize empty collections on first startup
- [ ] Seed only baseline/reference data if required (see Seed Data section)

**If migrating existing data** (not recommended per project rules):

- [ ] Export collections from `pardali_service` using `mongodump`
- [ ] Transform documents if schema has changed
- [ ] Import to `mymitraa_taskflow` using `mongorestore`
- [ ] Verify document counts match
- [ ] Run validation queries to confirm data integrity

**Do Not**: Run database migrations, do not connect to live database during discovery.

---

### Phase 4: Index and Schema Validation

#### Required Indexes for `mymitraa_taskflow`

Based on PM-TOOL schema, these indexes should exist:

| Collection | Index Fields | Type |
|------------|------------|------|
| **companies** | `{ companyId: 1 }` | Unique, single field |
| **companies** | `{ name: 1 }` | Single field, for searches |
| **wells** | `{ wellId: 1 }` | Unique, single field |
| **wells** | `{ companyId: 1 }` | Composite, for company-well relationship |
| **reports** | `{ createdDate: -1 }` | Single field, sorted by date |
| **reports** | `{ companyId: 1, createdDate: -1 }` | Composite, for company-filtered reports |
| **tasks** | `{ createdDate: -1 }` | Single field, for task listing |
| **tasks** | `{ status: 1 }` | Single field, for status filtering |
| **meetings** | `{ startDate: -1 }` | Single field, for meeting scheduling |
| **users** | `{ email: 1 }` | Unique, for user authentication |

**Index Verification**: After database creation, run:
```javascript
db.getSiblingDB("mymitraa_taskflow").getCollectionNames()
db.getSiblingDB("mymitraa_taskflow").getIndexes()
```

---

### Phase 5: Spring Data MongoDB Auto-Creation

Spring Data MongoDB with `@Document` annotations will auto-create collections and apply indexes if configured with `auto-create-collections=true` (JHipster default behavior).

**Configuration Check**: Ensure no manual collection creation is required. The JHipster Spring Data MongoDB configuration typically:

1. Scans `@Document`-annotated classes
2. Auto-creates collections on first `MongoTemplate` operation
3. Applies indexes from `@Indexed` annotations or default behavior

**Verification**: Start application with fresh `mymitraa_taskflow` database and confirm:
- Collections are created automatically
- Basic CRUD operations work without index errors
- Application logs show collection creation messages

---

## Migration Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Existing data loss** | LOW | CRITICAL | Never migrate from `pardali_service`; start fresh for MyMitraa |
| **Schema incompatibility** | LOW | HIGH | Domain models unchanged; only DB name changes; `@Document` annotations will map correctly |
| **Credential exposure** | MEDIUM | CRITICAL | Generate new credentials; never reuse exposed `fronteradevdbuser`/`cbQUQME7R0vk7r2` |
| **Wrong database connected** | MEDIUM | HIGH | Verify `spring.data.mongodb.database= mymitraa_taskflow` before startup; use separate profiles |
| **Index mismatches** | LOW | MEDIUM | Auto-creation by Spring Data; verify after first startup |
| **Authentication failure** | HIGH | HIGH | Test connection with new credentials before deploying; use MongoDB compass for manual verification |

---

## Rollback Plan

If migration fails or causes issues:

1. **Do not modify** the original `pardali_service` database (it was never touched)
2. **Drop** `mymitraa_taskflow` database: `db.getSiblingDB("admin").dropDatabase()` or `mongodrop mymitraa_taskflow`
3. **Reconfigure** with original `pardali_service` settings
4. **Redeploy** original PM-TOOL application using original credentials
5. **Investigate** failure cause before retrying migration

**Rollback is safe** because original database was never modified (read-only discovery only).

---

## Verification Checklist

### Pre-Startup Verification
- [ ] `spring.data.mongodb.database: mymitraa_taskflow` in config
- [ ] `spring.data.mongodb.username: mymitraa_dbuser` (not fronteradevdbuser)
- [ ] `spring.data.mongodb.password` is environment variable, not hardcoded
- [ ] `spring.data.mongodb.host: localhost` (or correct host)
- [ ] No hardcoded `pardali_service` references in any config file
- [ ] No hardcoded `cbQUQME7R0vk7r2` references anywhere

### Post-Startup Verification
- [ ] Application starts without MongoDB connection errors
- [ ] `mymitraa_taskflow` database is created automatically
- [ ] Collections match expected names (companies, wells, reports, tasks, meetings, users)
- [ ] Basic CRUD operations work (create, read, update, delete)
- [ ] Authentication works with new JWT secret
- [ ] No `pardali_service` or `fronteradevdbuser` logs appear
- [ ] Application logs show collection creation: `created collection mymitraa_taskflow.companies`

### Security Verification
- [ ] New JWT secret is in use (old `my-secret-token-to-change-in-production` rejected)
- [ ] New SMTP credentials working (old `optimaplatform@gmail.com`/`pagasytictzysjhz` rejected)
- [ ] MongoDB user `mymitraa_dbuser` has only `readWrite` on `mymitraa_taskflow`
- [ ] No exposed credentials in application logs or git history

---

## Migration Commands (For Reference Only - Do Not Run Without Approval)

```bash
# 1. Create new MongoDB user (on MongoDB shell)
db = db.getSiblingDB("mymitraa_gateway");
db.createUser({
  user: "mymitraa_dbuser",
  pwd: "<strong-password>",
  roles: [{ role: "readWrite", db: "mymitraa_taskflow" }]
});

# 2. Create database via Spring Data (happens auto on first app start)
# No manual command needed

# 3. Verify database creation
mongosh "mongodb://mymitraa_dbuser:<password>@localhost:27017/mymitraa_taskflow"
db.getCollectionNames()

# 4. Drop for rollback (emergency only)
mongosh "mongodb://admin:<admin-password>@localhost:27017"
db.dropDatabase("mymitraa_taskflow")
```

---

## Database Migration Plan Conclusion

**Migration Type**: Fresh database (recommended) - No data migration from `pardali_service`
**Database Name**: `mymitraa_taskflow`
**Username**: `mymitraa_dbuser` (new, generated)
**Password**: Generated (environment variable, not hardcoded)
**Host**: `localhost` (development) or separate production host
**Authentication DB**: `mymitraa_gateway` (new)

**Critical Requirements**:
1. ✅ Generate new MongoDB credentials (do not reuse exposed values)
2. ✅ Use environment variables for all sensitive config
3. ✅ Never modify original `pardali_service` database
4. ✅ Allow Spring Data MongoDB to auto-create collections
5. ✅ Verify no Kellton/original references remain in config

**Status**: ✅ DATABASE MIGRATION PLAN COMPLETE - awaiting credential generation and Phase 2 execution approval.