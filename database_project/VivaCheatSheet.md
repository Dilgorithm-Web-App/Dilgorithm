# DB Project Viva Cheat Sheet

## 1) What I implemented

- Database script: `AuthDatabase.sql`
  - Tables + constraints
  - 4 stored procedures
  - 3 transactions (inside procedures)
  - 3 views
  - 3 triggers
- DAL layer: `DAL.cs`
  - C# DB connection
  - Login/signup methods call stored procedures
- Demo/testing scripts:
  - `TriggerTest.sql`
  - `ViewsAndTransactionsTest.sql`

## 2) Login/Signup flow (what to say)

1. User enters credentials in frontend.
2. Backend endpoint calls stored procedure:
   - signup -> `sp_RegisterUser`
   - login -> `sp_LoginUser`
3. Procedure performs backend validations.
4. On success:
   - signup returns created `UserId`
   - login returns `SessionId` and `UserId`
5. Frontend redirects to dummy profile page (`/db-profile`) to show successful login/signup.
6. On failure, stored procedure message is returned and shown (e.g., invalid credentials, account locked).

## 3) Stored procedures (quick lines)

- `sp_RegisterUser`: validates + inserts user/profile in one transaction.
- `sp_LoginUser`: validates login, records failed attempts, creates session on success.
- `sp_CreateOrUpdateUserProfile`: upsert profile in one transaction.
- `sp_UnlockUser`: admin utility to unlock user.

## 4) Transactions (quick lines)

- Transactions are in:
  - `sp_RegisterUser`
  - `sp_LoginUser`
  - `sp_CreateOrUpdateUserProfile`
- They guarantee atomic behavior: commit on success, rollback on real errors.

## 5) Triggers (quick lines)

- `trg_Users_UpdateTimestamp`: updates `UpdatedAt` after any user update.
- `trg_FailedLogin_AutoLockUser`: locks user after failed attempts threshold.
- `trg_UserProfiles_AfterInsert`: writes profile creation audit.

## 6) Views (quick lines)

- `vw_UserPublicProfile`: joined user + profile details.
- `vw_LoginAttemptSummary`: failed login aggregation by email.
- `vw_ActiveSessions`: currently active sessions.

## 7) How to run demo in class

1. Open **SQL Server Management Studio (SSMS)**.
2. Connect to: `DESKTOP-3O20B06\SQLEXPRESS`.
3. Run `AuthDatabase.sql` first.
4. Run `TriggerTest.sql` to show trigger behavior.
5. Run `ViewsAndTransactionsTest.sql` to show views + transaction commit/rollback.

## 8) Expected proofs to show

- Wrong password 3 times -> user gets locked (`IsLocked = 1`).
- Profile insert -> appears in `UserProfileAudit`.
- Bad input (like short hash / too long bio) -> no bad row committed.
- Views return meaningful rows (`vw_*` queries).

## 9) Common viva questions

- **Why stored procedures?**
  - Centralized backend checks, reusable DB logic, consistent data handling.
- **Why transactions?**
  - Prevent partial writes and maintain integrity.
- **Why triggers?**
  - Automatic enforcement/auditing without extra application code.
- **Why views?**
  - Simplified read/reporting layer and cleaner query reuse.
