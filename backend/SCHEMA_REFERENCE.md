# FinPilot Database Schema Reference

## Overview
Complete schema definition for all 17 tables, relationships, and constraints. This document serves as the single source of truth for the database design.

---

## User Management

### `users` Table
**Primary storage for all user identities.**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supabase_uid VARCHAR UNIQUE NOT NULL,           -- Auth identity from Supabase
    email VARCHAR UNIQUE NOT NULL,                  -- User email
    full_name VARCHAR(200),                         -- Display name
    avatar_url TEXT,                                -- Profile picture URL
    role VARCHAR(20) NOT NULL DEFAULT 'student',   -- student | admin
    onboarding_done BOOLEAN DEFAULT FALSE,          -- Onboarding completion flag
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    CONSTRAINT ck_user_role CHECK (role IN ('student', 'admin')),
    INDEX ix_users_supabase_uid (supabase_uid),
    INDEX ix_users_email (email)
);
```

**Relationships**:
- ← Owns many: `user_progress`, `quiz_attempts`, `user_xp`, `streaks`, `badges`, `conversations`, `budget_plans`, `calc_history`, `watchlist_items`
- Has one: `user_xp`, `streak`, user's badges

---

## Learning Management

### `modules` Table
**Categorizes lessons into learning tracks.**

```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,                    -- Module name
    slug VARCHAR(100) UNIQUE NOT NULL,              -- URL-safe identifier
    description TEXT,                               -- Module description
    level VARCHAR(20) NOT NULL,                     -- beginner | intermediate | advanced
    track VARCHAR(10),                              -- A | B | C (learning path)
    order_index INTEGER DEFAULT 0,                  -- Display order
    icon_url TEXT,                                  -- Module icon
    is_published BOOLEAN DEFAULT FALSE,             -- Publication status
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    INDEX ix_modules_order_index (order_index)
);
```

**Relationships**:
- ← Has many: `lessons` (CASCADE delete)

---

### `lessons` Table
**Individual learning units within modules.**

```sql
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,                    -- Lesson title
    slug VARCHAR(100) NOT NULL,                     -- URL-safe identifier
    content_type VARCHAR(20) DEFAULT 'markdown',   -- markdown | video | interactive
    content_markdown TEXT,                          -- Markdown content
    video_url TEXT,                                 -- Video URL (if video content)
    order_index INTEGER DEFAULT 0,                  -- Order within module
    estimated_minutes INTEGER DEFAULT 5,            -- Time to complete
    xp_reward INTEGER DEFAULT 10,                   -- XP granted for completion
    is_published BOOLEAN DEFAULT FALSE,             -- Publication status
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    UNIQUE (module_id, slug),
    INDEX ix_lessons_module_id (module_id)
);
```

**Relationships**:
- → Belongs to: `modules`
- ← Has many: `quizzes`, `user_progress` (CASCADE delete)

---

## Assessment

### `quizzes` Table
**Quizzes associated with lessons.**

```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,                    -- Quiz title
    passing_score INTEGER DEFAULT 70,               -- Pass threshold (%)
    max_attempts INTEGER DEFAULT 3,                 -- Attempt limit
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    INDEX ix_quizzes_lesson_id (lesson_id)
);
```

**Relationships**:
- → Belongs to: `lessons`
- ← Has many: `questions`, `user_quiz_attempts` (CASCADE delete)

---

### `questions` Table
**Quiz questions with configurable types and JSONB options.**

```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,                    -- Question statement
    question_type VARCHAR(20) NOT NULL,             -- mcq | true_false | fill_blank
    options JSONB,                                  -- [{"key":"A","text":"Option A"},...]
    correct_answer TEXT NOT NULL,                   -- Answer key or value
    explanation TEXT,                               -- Why the answer is correct
    difficulty VARCHAR(10) DEFAULT 'medium',        -- easy | medium | hard
    points INTEGER DEFAULT 10,                      -- Points awarded
    order_index INTEGER DEFAULT 0,                  -- Question order
    
    INDEX ix_questions_quiz_id (quiz_id)
);
```

**JSONB Format for `options`**:
```json
[
    { "key": "A", "text": "First option" },
    { "key": "B", "text": "Second option" },
    { "key": "C", "text": "Third option" },
    { "key": "D", "text": "Fourth option" }
]
```

**Relationships**:
- → Belongs to: `quizzes`

---

### `user_quiz_attempts` Table
**Records of user quiz attempts with detailed feedback.**

```sql
CREATE TABLE user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,                         -- Points earned
    max_score INTEGER NOT NULL,                     -- Total possible
    percentage NUMERIC(5,2) NOT NULL,               -- Score %
    passed BOOLEAN NOT NULL,                        -- Pass/fail
    answers JSONB NOT NULL,                         -- User's answers
    feedback JSONB,                                 -- Detailed feedback
    time_taken_sec INTEGER,                         -- Duration in seconds
    attempt_number INTEGER DEFAULT 1,               -- Attempt count
    attempted_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    INDEX ix_user_quiz_attempts_user_id (user_id),
    INDEX ix_user_quiz_attempts_quiz_id (quiz_id),
    INDEX ix_user_quiz_attempts_user_quiz (user_id, quiz_id)
);
```

**JSONB Format for `answers`**:
```json
{
    "question_1_uuid": "A",
    "question_2_uuid": "true",
    "question_3_uuid": "capital of France"
}
```

**JSONB Format for `feedback`**:
```json
{
    "question_1_uuid": {
        "correct": true,
        "reason": "Good choice!"
    },
    "question_2_uuid": {
        "correct": false,
        "reason": "Actually, the answer was..."
    }
}
```

**Relationships**:
- → Belongs to: `users`, `quizzes`

---

## Progress Tracking

### `user_progress` Table
**Tracks lesson completion progress per user.**

```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,                -- Completion status
    completed_at TIMESTAMP WITH TIMEZONE,           -- Completion timestamp
    time_spent_sec INTEGER DEFAULT 0,               -- Time spent on lesson
    xp_earned INTEGER DEFAULT 0,                    -- XP from lesson + quiz
    
    UNIQUE (user_id, lesson_id),
    INDEX ix_user_progress_user_id (user_id),
    INDEX ix_user_progress_user_completed (user_id, completed),
    INDEX ix_user_progress_user_lesson (user_id, lesson_id)
);
```

**Relationships**:
- → Belongs to: `users`, `lessons`

---

### `user_xp` Table
**Aggregate XP and level tracking per user.**

```sql
CREATE TABLE user_xp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,                     -- Total XP earned
    level INTEGER DEFAULT 1,                        -- Current level
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    UNIQUE (user_id)
);
```

**Relationships**:
- → Belongs to: `users` (one-to-one)

---

### `streaks` Table
**Tracks user learning streaks for motivation.**

```sql
CREATE TABLE streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,               -- Active streak days
    longest_streak INTEGER DEFAULT 0,               -- Best streak days
    last_activity_date DATE,                        -- Last lesson date
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    UNIQUE (user_id)
);
```

**Relationships**:
- → Belongs to: `users` (one-to-one)

---

## Gamification

### `badges` Table
**Defines achievement badges.**

```sql
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,              -- Badge name (e.g., "Finance Master")
    description TEXT NOT NULL,                      -- Unlock requirement
    icon_url TEXT NOT NULL,                         -- Badge image URL
    criteria_type VARCHAR(40) NOT NULL,             -- lessons_completed | xp_reached | streak_length
    criteria_value INTEGER NOT NULL,                -- Threshold value
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    UNIQUE (name)
);
```

**Example Badge**:
```json
{
    "name": "Century Club",
    "description": "Earn 100+ XP",
    "criteria_type": "xp_reached",
    "criteria_value": 100
}
```

**Relationships**:
- ← Has many: `user_badges` (CASCADE delete)

---

### `user_badges` Table
**Tracks badges earned by users.**

```sql
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    UNIQUE (user_id, badge_id),
    INDEX ix_user_badges_user_id (user_id)
);
```

**Relationships**:
- → Belongs to: `users`, `badges`

---

## AI Tutor

### `ai_conversations` Table
**Stores AI tutor conversations history.**

```sql
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,    -- NULL if general chat
    title VARCHAR(200) DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    INDEX ix_ai_conversations_user_id (user_id),
    INDEX ix_ai_conversations_user_updated (user_id, updated_at DESC)
);
```

**Relationships**:
- → Belongs to: `users`, `lessons` (optional)
- ← Has many: `ai_messages` (CASCADE delete)

---

### `ai_messages` Table
**Individual messages within AI conversations.**

```sql
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,                      -- user | assistant | system
    content TEXT NOT NULL,                          -- Message text
    token_count INTEGER,                            -- Tokens consumed
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    INDEX ix_ai_messages_conversation_id (conversation_id),
    INDEX ix_ai_messages_conv_created (conversation_id, created_at)
);
```

**Relationships**:
- → Belongs to: `ai_conversations`

---

## Budget Planning

### `budget_plans` Table
**Monthly budget plans for users.**

```sql
CREATE TABLE budget_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL,                            -- Budget period (e.g., 2024-08-01)
    monthly_income NUMERIC(12,2) NOT NULL,          -- Total income
    currency VARCHAR(10) DEFAULT 'INR',             -- Currency code
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    UNIQUE (user_id, month),
    INDEX ix_budget_plans_user_id (user_id)
);
```

**Relationships**:
- → Belongs to: `users`
- ← Has many: `budget_entries` (CASCADE delete)

---

### `budget_entries` Table
**Line items within budget plans.**

```sql
CREATE TABLE budget_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES budget_plans(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL,                  -- needs | wants | savings | investments
    label VARCHAR(200) NOT NULL,                    -- Entry description
    budgeted NUMERIC(12,2) NOT NULL,                -- Allocated amount
    actual NUMERIC(12,2) DEFAULT 0,                 -- Spent amount
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    CONSTRAINT ck_budget_entry_category 
        CHECK (category IN ('needs', 'wants', 'savings', 'investments')),
    CONSTRAINT ck_budget_entry_actual_nonneg 
        CHECK (actual >= 0),
    INDEX ix_budget_entries_plan_id (plan_id)
);
```

**Relationships**:
- → Belongs to: `budget_plans`

---

## Investment Calculators

### `calculator_history` Table
**Stores calculation snapshots (SIP, Lumpsum).**

```sql
CREATE TABLE calculator_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculator_type VARCHAR(20) NOT NULL,           -- sip | lumpsum
    params JSONB NOT NULL,                          -- Input parameters
    result_maturity NUMERIC(15,2) NOT NULL,         -- Final amount
    result_total_invested NUMERIC(15,2) NOT NULL,   -- Total invested
    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    CONSTRAINT ck_calc_type 
        CHECK (calculator_type IN ('sip', 'lumpsum')),
    INDEX ix_calculator_history_user_id (user_id),
    INDEX ix_calculator_history_user_created (user_id, created_at DESC)
);
```

**JSONB Format for `params` (SIP)**:
```json
{
    "monthly_investment": 10000,
    "annual_rate_percent": 12,
    "time_period_years": 10
}
```

**JSONB Format for `params` (Lumpsum)**:
```json
{
    "principal": 100000,
    "annual_rate_percent": 12,
    "time_period_years": 10,
    "compounding_frequency": "yearly"
}
```

**Relationships**:
- → Belongs to: `users`

---

## Watchlist

### `watchlist_items` Table
**Stock watchlist for educational tracking.**

```sql
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,                    -- Stock symbol (e.g., RELIANCE)
    name VARCHAR(200) NOT NULL,                     -- Company name
    exchange VARCHAR(10) DEFAULT 'NSE',             -- NSE | BSE | etc
    notes VARCHAR(500),                             -- User notes
    added_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),
    
    UNIQUE (user_id, symbol),
    INDEX ix_watchlist_items_user_id (user_id),
    INDEX ix_watchlist_items_user_symbol (user_id, symbol)
);
```

**Relationships**:
- → Belongs to: `users`

---

## Constraints Summary

### Unique Constraints
| Constraint | Table | Columns | Purpose |
|-----------|-------|---------|---------|
| `uq_lesson_module_slug` | lessons | (module_id, slug) | No duplicate lessons per module |
| `uq_user_lesson_progress` | user_progress | (user_id, lesson_id) | One progress record per lesson |
| `uq_user_badge` | user_badges | (user_id, badge_id) | Badge earned once per user |
| `uq_user_symbol` | watchlist_items | (user_id, symbol) | One watchlist entry per symbol |
| `uq_user_budget_month` | budget_plans | (user_id, month) | One budget plan per month |

### Check Constraints
| Constraint | Table | Condition | Purpose |
|-----------|-------|-----------|---------|
| `ck_user_role` | users | role IN ('student','admin') | Valid role values |
| `ck_budget_entry_category` | budget_entries | category IN ('needs','wants','savings','investments') | Valid budget categories |
| `ck_budget_entry_actual_nonneg` | budget_entries | actual >= 0 | Non-negative spending |
| `ck_calc_type` | calculator_history | calculator_type IN ('sip','lumpsum') | Valid calculator types |

---

## Index Strategy

### High-Priority Indexes (Performance Critical)
- `users(supabase_uid)` — UID-based user lookups
- `users(email)` — Email-based authentication
- `lessons(module_id)` — Module content retrieval
- `user_progress(user_id)` — User dashboard queries
- `ai_conversations(user_id)` — Chat history lookup

### Composite Indexes (Complex Queries)
- `user_progress(user_id, completed)` — Completion statistics
- `user_quiz_attempts(user_id, quiz_id)` — Attempt history
- `ai_messages(conversation_id, created_at)` — Message context window
- `calculator_history(user_id, created_at DESC)` — Recent calculations
- `watchlist_items(user_id, symbol)` — Duplicate detection

### Descending Order Indexes (Sorting)
- `ai_conversations(user_id, updated_at DESC)` — Newest first listing
- `calculator_history(user_id, created_at DESC)` — Reverse chronological

---

## Data Types Reference

| Type | PostgreSQL | SQLAlchemy | Use Case |
|------|------------|-----------|----------|
| UUID | UUID | `UUID(as_uuid=True)` | Primary/foreign keys |
| VARCHAR | VARCHAR(n) | `String(n)` | Text with length limit |
| TEXT | TEXT | `Text` | Unlimited text (markdown, descriptions) |
| INTEGER | INTEGER | `Integer` | Whole numbers |
| NUMERIC(p,s) | NUMERIC(p,s) | `Numeric(p,s)` | Precise decimals (money, percentages) |
| JSONB | JSONB | `JSONB` | Flexible object storage |
| DATE | DATE | `Date` | Calendar dates |
| TIMESTAMP | TIMESTAMP | `DateTime(timezone=True)` | Points in time with timezone |
| BOOLEAN | BOOLEAN | `Boolean` | True/false flags |

---

## Cascade Behavior

All foreign keys use **CASCADE delete** except:
- `ai_conversations.lesson_id` → Uses **SET NULL** (optional relationship)

This ensures:
- When a user is deleted, all their data is cleaned up
- When a module is deleted, all lessons and progress are cleaned up
- When a lesson is deleted (rare), progress records are also deleted
- Conversations can survive lesson deletion (SET NULL)

---

## Connection Example

```python
# In SQLAlchemy application
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://postgres:password@host:5432/database",
    echo=False,
    pool_size=10,
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession)

# Usage
async with AsyncSessionLocal() as session:
    user = await session.get(User, user_id)
```

---

## Notes for Developers

1. **Always use async/await** with PostgreSQL AsyncPG driver
2. **JSONB columns** are queryable with PostgreSQL operators (→, ->>)
3. **UUID primary keys** are better than auto-increment for distributed systems
4. **Cascading deletes** are configured — be careful with delete operations
5. **Indexes are essential** — queries use them for performance
6. **CHECK constraints** are enforced at database level — trust them
7. **Timezone-aware timestamps** prevent timezone confusion
8. **UNIQUE constraints** prevent data duplication at the database level

---

**Schema Version**: 1.0  
**PostgreSQL Version**: 12+  
**Supabase Compatible**: ✅ Yes  
**Last Updated**: 2026-08-23
