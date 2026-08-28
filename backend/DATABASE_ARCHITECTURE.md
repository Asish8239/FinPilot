# FinPilot Database Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FINPILOT BACKEND                           │
├─────────────────────────────────────────────────────────────────┤
│  SQLAlchemy ORM Layer (Async)                                   │
│  └─ sqlalchemy.ext.asyncio + asyncpg                            │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Dialect Configuration                               │
│  └─ UUID, JSONB, CHECK constraints                              │
├─────────────────────────────────────────────────────────────────┤
│  Alembic Migration Engine                                       │
│  └─ Version control for schema (0001, 0002)                    │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Supabase)                                 │
│  ├─ 17 Tables                                                   │
│  ├─ 18 Indexes                                                  │
│  ├─ 4 CHECK Constraints                                         │
│  └─ 100% Async-ready                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entity Relationship Diagram (ERD)

```
                           ┌──────────────┐
                           │    USERS     │
                           ├──────────────┤
                           │ id (PK)      │
                           │ supabase_uid │
                           │ email        │
                           │ full_name    │
                           │ avatar_url   │
                           │ role (CK)    │
                           │ onboarding   │
                           │ created_at   │
                           │ updated_at   │
                           └──────┬───────┘
                  ┌────────────────┼────────────────┐
                  │                │                │
        ┌─────────▼────────┐  ┌────▼────────┐  ┌───▼─────────────┐
        │ USER_PROGRESS    │  │ USER_XP     │  │ STREAKS         │
        ├──────────────────┤  ├─────────────┤  ├─────────────────┤
        │ id (PK)          │  │ id (PK)     │  │ id (PK)         │
        │ user_id (FK)     │  │ user_id(FK) │  │ user_id(FK)     │
        │ lesson_id (FK)   │  │ total_xp    │  │ current_streak  │
        │ completed        │  │ level       │  │ longest_streak  │
        │ completed_at     │  │ updated_at  │  │ last_activity   │
        │ time_spent_sec   │  │             │  │ updated_at      │
        │ xp_earned        │  │ [1:1 rel]   │  │ [1:1 rel]       │
        │ [UQ: user_lesson]│  └─────────────┘  └─────────────────┘
        └────────┬──────────┘
                 │
                 └─────────────────────────────┬──────────────────┐
                                               │                  │
                                    ┌──────────▼──────┐    ┌──────▼────────┐
                                    │ QUIZ_ATTEMPTS   │    │ USER_BADGES   │
                                    ├─────────────────┤    ├───────────────┤
                                    │ id (PK)         │    │ id (PK)       │
                                    │ user_id (FK)    │    │ user_id (FK)  │
                                    │ quiz_id (FK)    │    │ badge_id (FK) │
                                    │ score           │    │ earned_at     │
                                    │ percentage      │    │ [UQ: user_id, │
                                    │ passed          │    │     badge_id]│
                                    │ answers (JSONB) │    └───────────────┘
                                    │ feedback(JSONB) │
                                    │ time_taken      │
                                    └─────────────────┘

        ┌────────────────────────────────────────────────────────────────────┐
        │                    LEARNING MANAGEMENT                             │
        ├────────────────────────────────────────────────────────────────────┤
        │                                                                    │
        │  ┌──────────────┐      ┌─────────────┐      ┌──────────────┐     │
        │  │   MODULES    │      │   LESSONS   │      │    QUIZZES   │     │
        │  ├──────────────┤      ├─────────────┤      ├──────────────┤     │
        │  │ id (PK)      │      │ id (PK)     │      │ id (PK)      │     │
        │  │ title        │◄─────┤ module_id ──►     │ lesson_id ◄──┤     │
        │  │ slug (UQ)    │      │ (FK)        │      │ (FK)         │     │
        │  │ description  │      │ title       │      │ title        │     │
        │  │ level        │      │ slug        │      │ passing_score│     │
        │  │ track        │      │ content_type│      │ max_attempts │     │
        │  │ order_index  │      │ content_md  │      └──────┬───────┘     │
        │  │ icon_url     │      │ video_url   │             │             │
        │  │ is_published │      │ order_index │             │             │
        │  │ created_at   │      │ xp_reward   │             │             │
        │  └──────────────┘      │ is_published│      ┌──────▼──────────┐  │
        │                        │ created_at  │      │   QUESTIONS     │  │
        │                        │ updated_at  │      ├─────────────────┤  │
        │                        └─────────────┘      │ id (PK)         │  │
        │                                              │ quiz_id (FK)   │  │
        │                                              │ question_text  │  │
        │                                              │ question_type  │  │
        │                                              │ options(JSONB) │  │
        │                                              │ correct_answer │  │
        │                                              │ explanation    │  │
        │                                              │ difficulty     │  │
        │                                              │ points         │  │
        │                                              │ order_index    │  │
        │                                              └─────────────────┘  │
        │                                                                   │
        │  ┌──────────────┐                                               │
        │  │  BADGES      │                                               │
        │  ├──────────────┤                                               │
        │  │ id (PK)      │                                               │
        │  │ name (UQ)    │                                               │
        │  │ description  │                                               │
        │  │ icon_url     │                                               │
        │  │ criteria_type│                                               │
        │  │ criteria_val │                                               │
        │  │ created_at   │                                               │
        │  └──────────────┘                                               │
        └────────────────────────────────────────────────────────────────────┘

        ┌────────────────────────────────────────────────────────────────────┐
        │                      AI TUTOR SYSTEM                               │
        ├────────────────────────────────────────────────────────────────────┤
        │                                                                    │
        │  ┌─────────────────────┐       ┌─────────────────────────┐       │
        │  │ AI_CONVERSATIONS    │       │ AI_MESSAGES             │       │
        │  ├─────────────────────┤       ├─────────────────────────┤       │
        │  │ id (PK)             │       │ id (PK)                 │       │
        │  │ user_id (FK) ────┐  │       │ conversation_id(FK)     │       │
        │  │ lesson_id(FK) ──┐│  │       │ role                    │       │
        │  │ title           ││  │       │ content                 │       │
        │  │ created_at      ││  │       │ token_count             │       │
        │  │ updated_at      ││  │       │ created_at              │       │
        │  │ [1:many]        ││  ├──────┤ [1:many]                │       │
        │  └────────────────┬┘│  │       └─────────────────────────┘       │
        │                  ││  │                                            │
        │                  ││  └──────────────┐                             │
        │                  ││                 │ (Points to                 │
        │                  └┴─────────┬───────┘  lessons or NULL)           │
        │                             │                                    │
        └─────────────────────────────┼────────────────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                 │
        ┌────────────▼────────────────────────────────▼──────────────────┐
        │                   FINANCIAL PLANNING                           │
        ├──────────────────────────────────────────────────────────────────┤
        │                                                                  │
        │  ┌──────────────────┐       ┌──────────────────────────────┐   │
        │  │ BUDGET_PLANS     │       │ CALCULATOR_HISTORY           │   │
        │  ├──────────────────┤       ├──────────────────────────────┤   │
        │  │ id (PK)          │       │ id (PK)                      │   │
        │  │ user_id (FK)     │       │ user_id (FK)                 │   │
        │  │ month (Date)     │       │ calculator_type (CK)         │   │
        │  │ monthly_income   │       │ params (JSONB)               │   │
        │  │ currency         │       │ result_maturity              │   │
        │  │ created_at       │       │ result_total_invested        │   │
        │  │ updated_at       │       │ created_at                   │   │
        │  │ [UQ:user,month]  │       └──────────────────────────────┘   │
        │  │ [1:many]         │                                           │
        │  └────────┬─────────┘       ┌──────────────────────────────┐   │
        │           │                 │ WATCHLIST_ITEMS              │   │
        │           │                 ├──────────────────────────────┤   │
        │  ┌────────▼──────────┐      │ id (PK)                      │   │
        │  │ BUDGET_ENTRIES    │      │ user_id (FK)                 │   │
        │  ├───────────────────┤      │ symbol                       │   │
        │  │ id (PK)           │      │ name                         │   │
        │  │ plan_id (FK)      │      │ exchange                     │   │
        │  │ category (CK)     │      │ notes                        │   │
        │  │ label             │      │ added_at                     │   │
        │  │ budgeted (numeric)│      │ [UQ:user,symbol]            │   │
        │  │ actual (numeric)  │      └──────────────────────────────┘   │
        │  │ created_at        │                                           │
        │  │ [1:many]          │                                           │
        │  └───────────────────┘                                           │
        │                                                                  │
        └──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                               │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Endpoints                                                         │  │
│  │ ├─ /users/* (auth, profile)                                      │  │
│  │ ├─ /modules/* (learning content)                                 │  │
│  │ ├─ /lessons/* (lesson management)                                │  │
│  │ ├─ /quizzes/* (quiz operations)                                  │  │
│  │ ├─ /progress/* (learning progress)                               │  │
│  │ ├─ /xp/* (gamification)                                          │  │
│  │ ├─ /badges/* (achievement tracking)                              │  │
│  │ ├─ /ai-tutor/* (AI conversations)                                │  │
│  │ ├─ /budget/* (budget planning)                                   │  │
│  │ └─ /calculator/* (investment tools)                              │  │
│  └────────────────────┬────────────────────────────────────────────┘  │
│                       │ SQLAlchemy ORM                                  │
│                       │ (Async)                                         │
└───────────────────────┼──────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │   PostgreSQL Connection Pool      │
        │   (asyncpg driver)                │
        │   ├─ Connection 1                 │
        │   ├─ Connection 2                 │
        │   └─ Connection 3..N              │
        └─────────┬───────────────────────┘
                  │
                  ▼
        ┌─────────────────────────────────────────────┐
        │      SUPABASE PostgreSQL Database           │
        │                                             │
        │  ┌─────────────────────────────────────┐   │
        │  │ Physical Storage                    │   │
        │  │ ├─ User Data Tables                 │   │
        │  │ ├─ Learning Content Tables          │   │
        │  │ ├─ Assessment Tables                │   │
        │  │ ├─ Progress Tracking Tables         │   │
        │  │ ├─ Financial Planning Tables        │   │
        │  │ ├─ AI Interaction Tables            │   │
        │  │ └─ Additional Feature Tables        │   │
        │  └─────────────────────────────────────┘   │
        │                                             │
        │  ┌─────────────────────────────────────┐   │
        │  │ Indexes (18 total)                  │   │
        │  │ ├─ Single-column indexes            │   │
        │  │ ├─ Composite indexes                │   │
        │  │ └─ Expression indexes (DESC)        │   │
        │  └─────────────────────────────────────┘   │
        │                                             │
        │  ┌─────────────────────────────────────┐   │
        │  │ Constraints                         │   │
        │  │ ├─ Primary Key (UUID)               │   │
        │  │ ├─ Foreign Keys (CASCADE)           │   │
        │  │ ├─ Unique Constraints               │   │
        │  │ ├─ CHECK Constraints                │   │
        │  │ └─ NOT NULL / DEFAULT constraints   │   │
        │  └─────────────────────────────────────┘   │
        │                                             │
        └─────────────────────────────────────────────┘
```

---

## Table Relationships Summary

### Ownership Hierarchy (Cascade Deletes)

```
users (root)
├─ user_progress → lessons
├─ user_quiz_attempts → quizzes → questions → modules
├─ user_xp (1:1)
├─ streaks (1:1)
├─ user_badges → badges
├─ ai_conversations → ai_messages (lesson optional)
├─ budget_plans → budget_entries
├─ calculator_history
└─ watchlist_items
```

When a user is deleted:
- ✅ All progress records deleted
- ✅ All quiz attempts deleted
- ✅ All AI conversations and messages deleted
- ✅ All budget plans and entries deleted
- ✅ All calculator history deleted
- ✅ All watchlist items deleted
- ✅ XP record deleted
- ✅ Streak record deleted
- ✅ Badge relationships deleted

### Query Patterns

**User Dashboard (Frequent)**
```sql
SELECT u.*, ux.total_xp, ux.level, s.current_streak
FROM users u
LEFT JOIN user_xp ux ON u.id = ux.user_id
LEFT JOIN streaks s ON u.id = s.user_id
WHERE u.supabase_uid = ?
-- Uses: ix_users_supabase_uid
```

**Lesson Progress Tracking**
```sql
SELECT up.*, l.title, l.xp_reward, m.slug
FROM user_progress up
JOIN lessons l ON up.lesson_id = l.id
JOIN modules m ON l.module_id = m.id
WHERE up.user_id = ? AND up.completed = false
-- Uses: ix_user_progress_user_id, ix_user_progress_user_completed
```

**Quiz History**
```sql
SELECT uqa.*, q.title, q.passing_score
FROM user_quiz_attempts uqa
JOIN quizzes q ON uqa.quiz_id = q.id
WHERE uqa.user_id = ? AND uqa.attempted_at > NOW() - '30 days'::interval
-- Uses: ix_user_quiz_attempts_user_id
```

**AI Conversation Context**
```sql
SELECT aim.*
FROM ai_messages aim
WHERE aim.conversation_id = ?
ORDER BY aim.created_at DESC
LIMIT 10
-- Uses: ix_ai_messages_conv_created (provides efficient ordering)
```

---

## Performance Characteristics

### Read Performance (Heavy)
- ✅ Single-row lookups: O(1) via indexes
- ✅ Range queries: O(log n) via B-tree indexes
- ✅ Joins: Optimized via foreign key indexes
- ✅ Aggregations: Fast with small datasets

### Write Performance (Medium)
- ✅ Inserts: Fast, minimal index updates
- ✅ Updates: Medium speed, constrained by indexes
- ✅ Deletes: Cascade delete may be slower on root entities

### JSONB Performance
- ✅ Querying JSONB: PostgreSQL native operators (→, ->>)
- ✅ Indexing JSONB: GiST/GIN indexes available
- ✅ No performance penalty vs traditional columns

---

## Scalability Design

### Connection Pooling
```python
# Settings in app/core/config.py
DB_POOL_SIZE = 10          # Min connections
DB_MAX_OVERFLOW = 20       # Max overflow connections
DB_POOL_RECYCLE = 1800     # Recycle after 30 min
DB_POOL_PRE_PING = True    # Verify connection health
```

### Async First
- All database operations are async/await
- No blocking I/O
- Scales to thousands of concurrent requests

### Index Strategy
- 18 indexes total (optimized for common queries)
- Composite indexes for multi-column WHERE clauses
- Descending indexes for reverse chronological sorting

---

## Data Integrity Guarantees

### ACID Properties
- ✅ **Atomicity**: Transactions all-or-nothing
- ✅ **Consistency**: CHECK constraints and FKs enforced
- ✅ **Isolation**: SERIALIZABLE isolation available
- ✅ **Durability**: Supabase handles replication/backups

### Cascade Rules
- **CASCADE DELETE**: Most tables (user owns data)
- **SET NULL**: Optional relationships (ai_conversations.lesson_id)

### Constraint Enforcement
All constraints enforced at database level:
```sql
-- Role validation
CONSTRAINT ck_user_role CHECK (role IN ('student', 'admin'))

-- Budget categories
CONSTRAINT ck_budget_entry_category 
  CHECK (category IN ('needs', 'wants', 'savings', 'investments'))

-- Non-negative values
CONSTRAINT ck_budget_entry_actual_nonneg CHECK (actual >= 0)

-- Calculator types
CONSTRAINT ck_calc_type CHECK (calculator_type IN ('sip', 'lumpsum'))
```

---

## Migration Timeline

```
Phase 1: Prepare (10 min)
  └─ Create Supabase project
  └─ Gather credentials

Phase 2: Configuration (5 min)
  └─ Update .env with Supabase URL
  └─ Verify connection

Phase 3: Schema Creation (10 min)
  └─ Run alembic upgrade head
  └─ Create all 17 tables
  └─ Create all 18 indexes
  └─ Apply all 4 constraints

Phase 4: Validation (15 min)
  └─ Verify schema in Supabase
  └─ Check data types and constraints
  └─ Test ORM connectivity

Phase 5: Data Migration (Optional, 10-30 min)
  └─ Dump local PostgreSQL
  └─ Restore to Supabase
  └─ Verify data integrity

Phase 6: Testing (20-30 min)
  └─ Run unit tests
  └─ Run integration tests
  └─ Verify endpoints

Phase 7: Deployment (5 min)
  └─ Update environment
  └─ Restart application
  └─ Monitor logs
```

**Total Time**: 1-2 hours (depending on data volume)

---

## PostgreSQL Extensions Used

| Extension | Purpose | Supabase Support |
|-----------|---------|------------------|
| `uuid-ossp` | Generate UUIDs | ✅ Pre-installed |
| (None else) | Schema only uses native PostgreSQL | ✅ 100% compatible |

---

## Backup and Recovery

### Supabase Automated Backups
- ✅ Daily backups included
- ✅ Point-in-time recovery (7+ days)
- ✅ Geographic redundancy
- ✅ Accessible from Supabase dashboard

### Manual Backup (if needed)
```bash
# Full database backup
pg_dump postgresql://postgres:pwd@host:5432/postgres > backup.sql

# Compress for storage
gzip backup.sql

# Recovery
gunzip backup.sql.gz
psql postgresql://postgres:pwd@host:5432/postgres < backup.sql
```

---

## Monitoring and Observability

### Key Metrics to Monitor
- Connection pool utilization
- Slow query log (> 100ms)
- Table sizes and growth
- Index usage and maintenance
- Replication lag (if applicable)

### Supabase Console Tools
- Query analytics dashboard
- Slow query log viewer
- Index recommendations
- Connection monitoring

---

## Security Considerations

1. **Authentication**
   - Users linked to Supabase auth via `supabase_uid`
   - All queries respect user_id isolation
   - Row-level security can be added if needed

2. **Secrets Management**
   - DATABASE_URL stored in .env (not committed)
   - Production URL stored in deployment platform secrets
   - No hardcoded credentials anywhere

3. **Data Protection**
   - JSONB data encrypted at rest (Supabase default)
   - Connections use SSL/TLS
   - No sensitive data in logs

4. **Access Control**
   - PostgreSQL role-based access control available
   - Supabase handles user/password management
   - Service key for backend auth

---

## Conclusion

The FinPilot database architecture is:

- ✅ **PostgreSQL-Native**: Uses native features (UUID, JSONB)
- ✅ **Supabase-Ready**: 100% compatible, no modifications needed
- ✅ **Async-First**: Built for concurrency from the ground up
- ✅ **Well-Indexed**: 18 indexes optimize common query patterns
- ✅ **ACID-Compliant**: Full transaction support and constraints
- ✅ **Scalable**: Connection pooling and async design handle growth
- ✅ **Production-Ready**: Used successfully with local PostgreSQL

**Ready for Supabase migration with zero breaking changes.**

---

**Architecture Version**: 1.0  
**Database System**: PostgreSQL 12+  
**Target Platform**: Supabase  
**Status**: ✅ Production-Ready  
**Last Updated**: 2026-08-23
