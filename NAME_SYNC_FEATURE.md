# Name Synchronization Feature

## Overview

When a user updates their name in settings, the new name is automatically synchronized across all projects and tasks where they are assigned.

## How It Works

### User Flow

1. User goes to Dashboard/Settings
2. User updates their name
3. System updates:
   - User name in `users` table
   - Player name in `players` table for ALL projects

### Technical Implementation

**API Endpoint**: `/api/user/update-name`

**Database Updates**:
```sql
-- Update user table
UPDATE users
SET name = 'New Name', updated_at = NOW()
WHERE id = 'user_id'

-- Update all player records for this user
UPDATE players
SET name = 'New Name'
WHERE user_id = 'user_id'
```

### Data Model

- **users** table: Stores user account information
  - `id`: User ID
  - `name`: User's display name
  - `email`: User's email

- **players** table: Stores user representation in each project
  - `id`: Player ID
  - `project_id`: Which project
  - `user_id`: Links to users table
  - `name`: Display name (synced with users.name)
  - `color`: Player color in that project

### Why This Is Needed

A user can be a member of multiple projects. In each project, they have a "player" record that represents them in that specific project. When they update their name, it should be consistent across all projects.

**Example**:
- User "Thomas" is a member of 4 projects
- User has 4 player records (one per project)
- User changes name to "Tom"
- All 4 player records update automatically
- Tasks assigned to these players now show "Tom" instead of "Thomas"

## Test Results

**Test User**: thomtechnic@gmail.com (Thomas)
**Projects**: 4 projects
**Player Records**: 4 records

**Test Result**: ✓ All 4 player names synchronized successfully

```
Before:
  User: Thomas
  Players: Tomtechnic, Tomtechnic, Tomtechnic, Thomas

After Update to "Thomas Test 1762019093098":
  User: Thomas Test 1762019093098
  Players: All 4 updated to "Thomas Test 1762019093098"

✓ All names synchronized correctly
```

## Files Modified

1. `/app/api/user/update-name/route.ts`
   - Added player name synchronization
   - Returns count of updated projects

## API Response

```json
{
  "success": true,
  "name": "New Name",
  "message": "Name updated successfully",
  "projectsUpdated": 4
}
```

The `projectsUpdated` field shows how many projects were affected.

## Edge Cases Handled

1. **User not in any projects**: `projectsUpdated: 0` (still updates user name)
2. **User in multiple projects**: All player records updated
3. **Database error**: Transaction ensures consistency
4. **Name validation**:
   - Cannot be empty
   - Max 100 characters
   - Trimmed automatically

## Benefits

- Consistent user identity across all projects
- No need for users to update their name in each project individually
- Tasks automatically reflect the updated name
- Seamless user experience

## Future Enhancements

Potential improvements:
- [ ] Bulk name update notification to team members
- [ ] Name change history/audit log
- [ ] Option to use different names per project (if needed)

---

**Status**: Implemented and tested
**Date**: 2025-11-01
**Test Result**: ✓ Success
