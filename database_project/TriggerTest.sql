USE DilgorithmDB;
GO

/*
Simple Trigger Demo
Run this after AuthDatabase.sql
*/

-- Clean old demo data (if present)
DELETE FROM dbo.FailedLoginAudit WHERE EmailTried IN ('trigger1@example.com', 'trigger2@example.com');
DELETE FROM dbo.UserProfileAudit WHERE UserId IN (SELECT UserId FROM dbo.Users WHERE Email IN ('trigger1@example.com', 'trigger2@example.com'));
DELETE FROM dbo.ActiveSessions WHERE UserId IN (SELECT UserId FROM dbo.Users WHERE Email IN ('trigger1@example.com', 'trigger2@example.com'));
DELETE FROM dbo.UserProfiles WHERE UserId IN (SELECT UserId FROM dbo.Users WHERE Email IN ('trigger1@example.com', 'trigger2@example.com'));
DELETE FROM dbo.Users WHERE Email IN ('trigger1@example.com', 'trigger2@example.com');
GO

PRINT 'STEP 1: Create two demo users';
DECLARE @U1 INT, @U2 INT, @M NVARCHAR(200);
DECLARE @HashA NVARCHAR(64) = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
DECLARE @HashB NVARCHAR(64) = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

EXEC dbo.sp_RegisterUser
    @FullName='Trigger One',
    @Email='trigger1@example.com',
    @Username='triggerone',
    @PasswordHash=@HashA,
    @UserId=@U1 OUTPUT,
    @Message=@M OUTPUT;

EXEC dbo.sp_RegisterUser
    @FullName='Trigger Two',
    @Email='trigger2@example.com',
    @Username='triggertwo',
    @PasswordHash=@HashB,
    @UserId=@U2 OUTPUT,
    @Message=@M OUTPUT;

SELECT @U1 AS User1, @U2 AS User2;
GO

PRINT 'STEP 2: Trigger trg_UserProfiles_AfterInsert proof';
SELECT TOP 5 AuditId, UserId, ActionType, ActionAt
FROM dbo.UserProfileAudit
ORDER BY AuditId DESC;
GO

PRINT 'STEP 3: Trigger trg_Users_UpdateTimestamp proof';
SELECT UserId, Email, UpdatedAt
FROM dbo.Users
WHERE Email='trigger1@example.com';

WAITFOR DELAY '00:00:01';

UPDATE dbo.Users
SET FullName='Trigger One Updated'
WHERE Email='trigger1@example.com';

SELECT UserId, Email, UpdatedAt
FROM dbo.Users
WHERE Email='trigger1@example.com';
GO

PRINT 'STEP 4: Trigger trg_FailedLogin_AutoLockUser proof';
DECLARE @LockUserId INT;
SELECT @LockUserId = UserId FROM dbo.Users WHERE Email='trigger2@example.com';

UPDATE dbo.Users SET FailedLoginCount=0, IsLocked=0 WHERE UserId=@LockUserId;

-- 3 failed attempts
UPDATE dbo.Users SET FailedLoginCount = FailedLoginCount + 1 WHERE UserId=@LockUserId;
INSERT INTO dbo.FailedLoginAudit(UserId, EmailTried, Reason) VALUES (@LockUserId, 'trigger2@example.com', 'Wrong password #1');

UPDATE dbo.Users SET FailedLoginCount = FailedLoginCount + 1 WHERE UserId=@LockUserId;
INSERT INTO dbo.FailedLoginAudit(UserId, EmailTried, Reason) VALUES (@LockUserId, 'trigger2@example.com', 'Wrong password #2');

UPDATE dbo.Users SET FailedLoginCount = FailedLoginCount + 1 WHERE UserId=@LockUserId;
INSERT INTO dbo.FailedLoginAudit(UserId, EmailTried, Reason) VALUES (@LockUserId, 'trigger2@example.com', 'Wrong password #3');

SELECT UserId, Email, FailedLoginCount, IsLocked
FROM dbo.Users
WHERE UserId=@LockUserId;
GO

PRINT 'Trigger demo complete.';
