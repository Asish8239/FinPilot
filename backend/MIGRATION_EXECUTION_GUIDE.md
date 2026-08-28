# Supabase PostgreSQL Migration Execution Guide

## Quick Reference

```bash
# 1. Update environment
export DATABASE_URL="postgresql+asyncpg://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres"

# 2. Run migrations
cd backend
alembic upgrade head

# 3. Verify schema
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres -c "\dt"

# 4. Restart application
# Update .env and restart backend service
```

---

## Detailed Step-by-Step Guide

### Step 1: Prepare Supabase Project

#### 1a. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create new project or note existing project details
- **Note the following**:
  - Project URL: `https://[PROJECT_ID].supabase.co`
  - Project API Key: (visible in dashboard)
  - Database password: (shown during creation or reset if needed)

#### 1b. Gather Connection Information
From Supabase dashboard, obtain:
- **Host**: `[PROJECT_ID].supabase.co`
- **Port**: `5432` (standard PostgreSQL)
- **Database**: `postgres` (default)
- **User**: `postgres` (default)
- **Password**: (from project settings)

#### 1c. Verify Connection Manually (Optional)
```bash
# Using psql (install if needed: brew install postgresql)
psql postgresql://postgres:PASSWORD@PROJECT_ID.supabase.co:5432/postgres -c "SELECT version();"

# Expected output: PostgreSQL 14+ version info
```

---

### Step 2: Backup Local Database

#### 2a. Export Current Data (if needed)
```bash
# Dump entire local database to file
pg_dump -h localhost -U postgres finpilot > finpilot_backup.sql

# Verify backup
wc -l finpilot_backup.sql  # Should have thousands of lines
file finpilot_backup.sql   # Should be ASCII text
```

#### 2b. (Optional) Export Specific Tables
```bash
# Export only users table
pg_dump -h localhost -U postgres -t users finpilot > users_backup.sql

# Export multiple tables
pg_dump -h localhost -U postgres -t users -t modules finpilot > minimal_backup.sql
```

---

### Step 3: Update Backend Configuration

#### 3a. Update `.env` File
```bash
# OLD (local)
DATABASE_URL=postgresql+asyncpg://postgres:YXpyx3BfZDOV7wyX@localhost:5432/finpilot

# NEW (Supabase)
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[PROJECT_ID].supabase.co:5432/postgres
```

**Example**:
```bash
# Before
DATABASE_URL=postgresql+asyncpg://postgres:abc123@localhost:5432/finpilot

# After
DATABASE_URL=postgresql+asyncpg://postgres:secure_pwd_123@my-project.supabase.co:5432/postgres
```

#### 3b. Update `alembic.ini` (Alternative Method)
Only needed if NOT using environment variable:
```ini
# alembic.ini - Line ~35
[alembic]
sqlalchemy.url = postgresql+asyncpg://postgres:PASSWORD@PROJECT_ID.supabase.co:5432/postgres
```

**Recommended**: Use environment variable in `.env` for security.

#### 3c. Verify Configuration
```bash
# Check .env is updated
grep DATABASE_URL backend/.env

# Expected output:
# DATABASE_URL=postgresql+asyncpg://postgres:...@PROJECT.supabase.co:5432/postgres
```

---

### Step 4: Test Connection Before Migration

#### 4a. Create Test Connection Script
```python
# test_connection.py
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_connection():
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres"
    )
    try:
        async with engine.connect() as conn:
            result = await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            print("✅ Connection successful!")
            print(f"Result: {result.scalar()}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        await engine.dispose()

asyncio.run(test_connection())
```

#### 4b. Run Test
```bash
cd backend
python test_connection.py

# Expected output:
# ✅ Connection successful!
# Result: 1
```

**Troubleshooting**:
| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Wrong host/port | Verify PROJECT_ID and port 5432 |
| `FATAL: password authentication failed` | Wrong password | Check Supabase project password |
| `database "finpilot" does not exist` | Using wrong database name | Change to `postgres` |
| `TimeoutError` | Network/firewall issue | Check IP restrictions in Supabase |

---

### Step 5: Create UUID Extension (Usually Pre-installed)

Supabase PostgreSQL includes `uuid-ossp` by default, but verify:

```bash
# Connect to Supabase database
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres

# Check if extension exists
\dx uuid-ossp

# If not listed, create it (migrations will do this)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

The migration `0001_initial_schema.py` includes:
```python
op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
```

So it will be created automatically if missing.

---

### Step 6: Run Alembic Migrations

#### 6a. Verify Migrations are Ready
```bash
cd backend

# Check current migration status
alembic current

# Expected output if new database:
# (No row was returned - database is not initialized)
```

#### 6b. Run Initial Migration
```bash
# Apply all migrations to Supabase
alembic upgrade head

# Expected output:
# INFO [alembic.runtime.migration] Context impl PostgresqlImpl...
# INFO [alembic.runtime.migration] Will assume transactional DDL...
# INFO [alembic.runtime.migration] Running upgrade  -> 0001, Initial schema
# INFO [alembic.runtime.migration] Running upgrade 0001 -> 0002, Check constraints
```

#### 6c. Verify Schema Creation
```bash
# Check which revisions are applied
alembic current

# Expected output:
# 0002_check_constraints_and_indexes

# List all revision history
alembic history

# Expected output:
# <base> -> 0001 (head), Initial schema
# 0001 -> 0002 (head), Check constraints and indexes
```

---

### Step 7: Verify Schema in Supabase

#### 7a. Connect to Supabase PostgreSQL
```bash
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres
```

#### 7b. List All Tables
```sql
-- Check tables exist
\dt

-- Should list all 17 tables:
-- users, modules, lessons, quizzes, questions
-- user_quiz_attempts, user_progress, user_xp, streaks
-- badges, user_badges, ai_conversations, ai_messages
-- budget_plans, budget_entries, calculator_history, watchlist_items
```

#### 7c. Verify Table Structure
```sql
-- Check users table
\d users

-- Expected columns:
-- id, supabase_uid, email, full_name, avatar_url, role, onboarding_done,
-- created_at, updated_at

-- Check JSONB columns in questions
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'questions' AND column_name = 'options';

-- Should show: options | jsonb
```

#### 7d. Verify Constraints
```sql
-- Check CHECK constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users' OR table_name = 'budget_entries';

-- Should show:
-- ck_user_role | CHECK
-- ck_budget_entry_category | CHECK
-- ck_budget_entry_actual_nonneg | CHECK
-- ck_calc_type | CHECK
```

#### 7e. Verify Indexes
```sql
-- List all indexes
\di

-- Count indexes (should be ~18)
SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';
```

---

### Step 8: Migrate Data (If Applicable)

Only follow this section if you have existing data to migrate.

#### 8a. Restore Backup to Supabase
```bash
# Restore from backup (if you have existing data)
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres < finpilot_backup.sql

# This will:
# 1. Create all tables (may conflict if migrations already ran)
# 2. Insert all data
# 3. Recreate indexes and sequences
```

#### 8b. Handle Conflicts
If you get errors about tables already existing:

**Option 1: Start fresh** (recommended for development)
```bash
# Skip data migration, just use empty schema
# Continue to Step 9
```

**Option 2: Drop and restore** (careful with production!)
```bash
# Connect to Supabase
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres

# Drop all tables (CAUTION - DESTRUCTIVE!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then restore
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres < finpilot_backup.sql
```

#### 8c: Verify Data Migration
```sql
-- Check record counts
SELECT 'users' as table_name, count(*) FROM users
UNION ALL
SELECT 'modules', count(*) FROM modules
UNION ALL
SELECT 'lessons', count(*) FROM lessons;

-- Verify relationships
SELECT * FROM users LIMIT 5;
SELECT * FROM modules LIMIT 5;
```

---

### Step 9: Update Application Configuration

#### 9a. Update `.env` Production Variables (if applicable)
For production deployment, update environment:

```bash
# .env (or deployment platform environment variables)
DATABASE_URL=postgresql+asyncpg://postgres:PROD_PASSWORD@PROD_PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://PROD_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
```

#### 9b. Restart Backend Application
```bash
# If running locally
# 1. Stop current backend: Ctrl+C
# 2. Update .env
# 3. Restart:
python -m uvicorn app.main:app --reload

# If deployed (example for typical deployment)
# Push updated .env to deployment platform
# Or update environment variables in platform console
# Restart backend service
```

#### 9c. Monitor Application Logs
```bash
# Watch for connection errors
tail -f logs/backend.log

# Should NOT show database connection errors
# Should show: "Application startup complete" or similar
```

---

### Step 10: Run Application Tests

#### 10a. Health Check Endpoint
```bash
curl http://localhost:8000/health

# Expected response:
# {"status": "ok", "database": "connected"}
```

#### 10b. Run Unit Tests
```bash
cd backend
pytest tests/ -v

# All tests should pass
# Database-specific tests should work with Supabase
```

#### 10c. Run Integration Tests
```bash
# Test actual database operations
pytest tests/integration/ -v --tb=short

# Should test:
# - User creation/retrieval
# - Module and lesson operations
# - Quiz and progress tracking
# - Budget planning operations
```

---

## Rollback Procedures

### If Migration Fails

#### Option 1: Downgrade to Previous Version
```bash
# Check current version
alembic current

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade 0001

# Downgrade to base (empty database)
alembic downgrade base
```

#### Option 2: Drop and Recreate
```bash
# Connect to Supabase
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres

# Drop everything
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Re-run migrations
alembic upgrade head
```

#### Option 3: Switch Back to Local Database
```bash
# Revert .env
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@localhost:5432/finpilot

# Restart application
# Data is still on local PostgreSQL
```

---

## Verification Checklist

Before considering migration complete:

- [ ] Connection test successful (`test_connection.py`)
- [ ] All migrations applied (`alembic current` shows `0002_check_constraints_and_indexes`)
- [ ] All 17 tables exist in Supabase (`\dt`)
- [ ] UUID extension created (`SELECT * FROM pg_available_extensions WHERE name='uuid-ossp'`)
- [ ] All CHECK constraints applied (4 constraints verified)
- [ ] All 18 indexes created (verified in Supabase console)
- [ ] JSONB columns are accessible and queryable
- [ ] Application connects without errors (check logs)
- [ ] Health endpoint returns healthy status
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Can create users, modules, progress records
- [ ] Can insert and query JSONB data (questions, calculator history)
- [ ] Cascade deletes work correctly

---

## Performance Baseline

After migration, run performance tests to establish baseline:

```bash
# Measure query performance
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres -c "
EXPLAIN ANALYZE
SELECT u.*, COUNT(p.id) as progress_count
FROM users u
LEFT JOIN user_progress p ON u.id = p.user_id
WHERE u.supabase_uid = 'test-uid'
GROUP BY u.id;"

# Should use indexes efficiently:
# Index Cond: (supabase_uid = 'test-uid')
# Total runtime: < 10ms
```

---

## Common Issues and Solutions

### Issue: "Extension uuid-ossp does not exist"
**Solution**: Migrations create it automatically. If manual:
```sql
CREATE EXTENSION "uuid-ossp";
```

### Issue: "Role \'postgres\' already exists"
**Solution**: This is normal on existing Supabase instance. Ignore.

### Issue: "JSONB column shows as NULL for existing rows"
**Solution**: Expected if migrating data. Ensure application handles NULL JSONB gracefully.

### Issue: "Connection timeout from application"
**Solution**: 
1. Check Supabase IP whitelist (usually auto-allows)
2. Test direct connection: `psql postgresql://postgres:...@...supabase.co`
3. Verify DATABASE_URL doesn't have typos

### Issue: "Duplicate key value violates unique constraint"
**Solution**: If restoring data:
1. Check for duplicate values in unique columns
2. Either clean data or use different dataset
3. Or start with empty Supabase database

### Issue: "FATAL: sorry, too many clients already"
**Solution**: Increase connection pool in Supabase:
- Dashboard → Database Settings → Connection Pooling
- Set appropriate pool size

---

## Post-Migration Checklist

After successful migration:

1. **Documentation**:
   - [ ] Update README with Supabase connection info
   - [ ] Document any application-specific configurations
   - [ ] Add Supabase project credentials to team password manager

2. **Monitoring**:
   - [ ] Set up database monitoring in Supabase console
   - [ ] Configure backups (Supabase provides automated backups)
   - [ ] Monitor slow queries

3. **Deployment**:
   - [ ] Update CI/CD pipeline with new DATABASE_URL
   - [ ] Test deployment pipeline end-to-end
   - [ ] Deploy to staging first
   - [ ] Verify in staging environment
   - [ ] Deploy to production with confidence

4. **Backup Local Data**:
   - [ ] Keep local PostgreSQL running as backup reference
   - [ ] Or export and archive local data
   - [ ] Store in secure location

5. **Team Communication**:
   - [ ] Notify team of Supabase migration
   - [ ] Share Supabase connection info (securely)
   - [ ] Update development documentation

---

## Troubleshooting Commands Reference

```bash
# Test connection
python test_connection.py

# Check migration status
alembic current
alembic history
alembic branches

# View current DATABASE_URL
grep DATABASE_URL backend/.env

# Connect directly to Supabase
psql postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres

# Run specific test
pytest tests/test_database.py -v -k "test_user_creation"

# Check application logs
tail -f logs/backend.log | grep -i database

# Verify data integrity
python -c "from app.core.database import engine; import asyncio; asyncio.run(check_db_health())"
```

---

## Timeline Estimate

| Step | Estimated Time | Notes |
|------|---------------|----|
| 1. Prepare Supabase | 5-10 min | Create project, gather credentials |
| 2. Backup local DB | 5-10 min | Optional, good practice |
| 3. Update config | 5 min | Edit .env |
| 4. Test connection | 5-10 min | Verify before migration |
| 5. UUID extension | <1 min | Usually pre-installed |
| 6. Run migrations | 5-10 min | Alembic should complete quickly |
| 7. Verify schema | 10-15 min | Check all tables, indexes, constraints |
| 8. Migrate data | 10-30 min | If applicable, depends on data size |
| 9. Update app config | 5-10 min | Restart application |
| 10. Run tests | 5-15 min | Unit and integration tests |
| **Total** | **1-2 hours** | Depends on data volume and testing scope |

---

## Success Criteria

Migration is successful when:

1. ✅ All 17 tables exist in Supabase
2. ✅ All 18 indexes are created
3. ✅ All 4 CHECK constraints are applied
4. ✅ Application successfully connects
5. ✅ Health endpoint returns healthy
6. ✅ Unit tests pass
7. ✅ Integration tests pass
8. ✅ Can perform CRUD operations on all tables
9. ✅ JSONB queries work correctly
10. ✅ No performance degradation from local PostgreSQL

---

**Last Updated**: 2026-08-23  
**Version**: 1.0  
**Target**: Supabase PostgreSQL  
**Status**: Ready for execution
