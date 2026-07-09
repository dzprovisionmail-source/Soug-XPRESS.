# Next Task

## The Immediate Next Task

**Draft the Constitution — after Founder approval of the blueprint.**

The Constitution proposal at `docs/v2/CONSTITUTION_PROPOSAL.md` contains a structure and chapter hierarchy (13 articles + Preamble + Closing). The next task is to advance this blueprint toward Founder approval, then write chapters one by one.

## What This Means — Step by Step

### Step 1 — Await Founder Approval
The Founder must approve the blueprint's structure and chapter hierarchy, and answer the 7 open questions (language, numbering, glossary, README relationship, protected articles, versioning, AI self-binding).

### Step 2 — Incorporate Founder Feedback
If the Founder requests structural changes, update the blueprint. If the Founder answers the 7 questions, record the answers in `DECISIONS.md`.

### Step 3 — Finalize the Blueprint
Once the Founder approves the structure and answers the questions, the blueprint is frozen. Record this as a decision in `DECISIONS.md`.

### Step 4 — Write Chapters One by One
Only after blueprint approval, write one chapter at a time. Each chapter requires per-chapter Founder approval before the next begins. The reading order is:

```
Preamble → I → II → III → IV → V → VI → VII → VIII → IX → X → XI → XII → XIII → Closing
```

## What Must NOT Happen

- Do **not** write Constitution chapter content before the blueprint is approved.
- Do **not** write any application code.
- Do **not** design any database schema.
- Do **not** generate any SQL.
- Do **not** touch Supabase.
- Do **not** commit or push without explicit Founder instruction.

## The Sequence After the Constitution

Once the Constitution is ratified, the full development sequence is:

```
Constitution ratified
    ↓
Vision document (formal, derived from Constitution)
    ↓
Architecture document (formal, derived from Vision)
    ↓
Founder Operating System design
    ↓
Database schema (derived from architecture)
    ↓
RLS / Security policies (after schema is frozen)
    ↓
Application implementation (last)
```

Each arrow is a gate. No stage begins until the previous stage is approved by the Founder.

## If You Are a New AI Agent Reading This

Your next action is:

1. Read `00_START_HERE.md` (if you have not already).
2. Read `AI_HANDOFF.md` for your operational rules.
3. Read `docs/v2/CONSTITUTION_PROPOSAL.md` to see the full blueprint.
4. Check `DECISIONS.md` to see if the blueprint has been approved since this file was last updated.
5. If the blueprint is approved, ask the Founder which chapter to write first.
6. If the blueprint is not yet approved, ask the Founder for their decision on the blueprint and the 7 open questions.

Do not proceed to any implementation work. The project is in documentation-first mode.

---

*Last updated: 2026-07-09*
