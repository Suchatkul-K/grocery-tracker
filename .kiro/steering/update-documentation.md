---
inclusion: auto
---

# Documentation Update Rule

**CRITICAL**: Whenever you make significant changes to the codebase, you MUST update the project documentation to maintain accurate context.

## What Requires Documentation Updates

Update documentation when you:

- Add new features or components
- Modify database schema or API structure
- Fix significant bugs or issues
- Change architectural patterns
- Add or modify services, repositories, or core modules
- Update dependencies or configuration
- Make breaking changes to existing APIs
- Complete spec tasks or milestones

## Files to Update

### 1. `.kiro/steering/implementation-history.md`

**Purpose**: Technical context for Kiro AI sessions

**Update sections:**
- `## Implementation Status` - Mark features as completed/in-progress
- `### 🔧 Key Technical Decisions` - Document architectural choices
- `### 🐛 Known Issues` - Track bugs and limitations
- `### 🔄 Recent Changes` - Add dated entry with change summary

**Format for Recent Changes:**
```markdown
**YYYY-MM-DD: Brief Title**
- Added: New features or components
- Fixed: Bug fixes and corrections
- Changed: Modifications to existing functionality
- Technical: Configuration or dependency updates
```

### 2. `docs/PROJECT_STATUS.md`

**Purpose**: Human-readable project documentation

**Update sections:**
- `## Quick Summary` - Update status if needed
- `## Current Status` - Update feature checklist
- `## Architecture Overview` - Update if structure changes
- `## API Reference` - Update if APIs change
- `## Key Technical Decisions` - Document major decisions
- `## Troubleshooting` - Add common issues and solutions
- `## Change Log` - Add dated entry with detailed changes
- `Last Updated` date at the top

**Format for Change Log:**
```markdown
### YYYY-MM-DD: Brief Title

**Added:**
- List new features

**Fixed:**
- List bug fixes

**Changed:**
- List modifications

**Technical:**
- List technical updates
```

## Update Process

1. **After completing work**, review what changed
2. **Identify significant changes** that affect project understanding
3. **Update implementation-history.md** with technical details
4. **Update PROJECT_STATUS.md** with user-friendly descriptions
5. **Update the date** at the top of PROJECT_STATUS.md
6. **Keep it concise** - focus on what's important for future context

## Examples of Good Updates

### Good: Specific and Actionable
```markdown
**2026-03-10: Added Shopping List Feature**
- Added: ShoppingListView component with auto-generation from low stock items
- Added: db.shoppingList.* API methods in new shopping-list.service.ts
- Fixed: Low stock calculation now excludes items with 0 restock threshold
- Technical: Added shopping_list table to schema
```

### Bad: Too Vague
```markdown
**2026-03-10: Updates**
- Made some changes
- Fixed stuff
- Updated files
```

## When NOT to Update

Skip documentation updates for:
- Minor code formatting or style changes
- Comment updates
- Test-only changes (unless fixing major test issues)
- Dependency patch updates (unless they fix critical issues)
- Typo fixes in code

## Verification

Before considering work complete:
- [ ] implementation-history.md updated with technical context
- [ ] PROJECT_STATUS.md updated with user-friendly descriptions
- [ ] Date updated in PROJECT_STATUS.md
- [ ] Change log entries added to both files
- [ ] Known issues section updated if applicable

## Why This Matters

Keeping documentation updated ensures:
- Future Kiro sessions have accurate context
- Developers can quickly understand project state
- Decisions and rationale are preserved
- Troubleshooting information is available
- Project history is maintained

**Remember**: Good documentation is a gift to your future self and others working on the project.
