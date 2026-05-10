# Database Project Deliverables

## Included files

- `AuthDatabase.sql`
  - Complete SQL Server database script with tables, keys, constraints, and auth objects.
- `DAL.cs`
  - 3rd-tier data access layer with DB connection and login/signup methods calling stored procedures.
- `AuthController.cs`
  - Example login/signup flow that redirects to a dummy profile page on success; shows error on failure.

## Requirement checklist

- Stored Procedures (>= 3):
  - `sp_RegisterUser`
  - `sp_LoginUser`
  - `sp_CreateOrUpdateUserProfile`
  - `sp_UnlockUser` (extra)

- Transactions (>= 3):
  - `sp_RegisterUser` uses `BEGIN TRANSACTION`
  - `sp_LoginUser` uses `BEGIN TRANSACTION`
  - `sp_CreateOrUpdateUserProfile` uses `BEGIN TRANSACTION`

- Views (>= 3):
  - `vw_UserPublicProfile`
  - `vw_LoginAttemptSummary`
  - `vw_ActiveSessions`

- Triggers (>= 3):
  - `trg_Users_UpdateTimestamp`
  - `trg_FailedLogin_AutoLockUser`
  - `trg_UserProfiles_AfterInsert`

## How to run

1. Execute `AuthDatabase.sql` in SQL Server Management Studio.
2. Point `ConnectionString` in `AuthController.cs` to your SQL Server instance.
3. Add these files into your C# ASP.NET MVC project.
4. Create basic views: `Login.cshtml`, `Signup.cshtml`, and `DummyProfile.cshtml`.
5. Test:
   - Valid signup -> redirects to `DummyProfile`
   - Valid login -> redirects to `DummyProfile`
   - Invalid credentials -> page shows relevant error message
