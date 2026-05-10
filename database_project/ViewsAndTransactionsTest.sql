USE DilgorithmDB;
GO

/*
Simple Views + Transactions Demo
Run this after AuthDatabase.sql
*/

-- Clean old demo data
DELETE FROM dbo.FailedLoginAudit WHERE EmailTried='viewtxn@example.com';
DELETE FROM dbo.ActiveSessions WHERE UserId IN (SELECT UserId FROM dbo.Users WHERE Email='viewtxn@example.com');
DELETE FROM dbo.UserProfiles WHERE UserId IN (SELECT UserId FROM dbo.Users WHERE Email='viewtxn@example.com');
DELETE FROM dbo.Users WHERE Email='viewtxn@example.com';
GO

PRINT 'STEP 1: Transaction demo with sp_RegisterUser';
DECLARE @UserId INT, @Msg NVARCHAR(200);
DECLARE @GoodHash NVARCHAR(64) = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
DECLARE @WrongHash NVARCHAR(64) = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
DECLARE @LongBio NVARCHAR(360) = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

-- Good call (commit expected)
EXEC dbo.sp_RegisterUser
    @FullName='View Txn User',
    @Email='viewtxn@example.com',
    @Username='viewtxnuser',
    @PasswordHash=@GoodHash,
    @UserId=@UserId OUTPUT,
    @Message=@Msg OUTPUT;
PRINT @Msg;

-- Bad call (rollback expected)
DECLARE @BadUserId INT, @BadMsg NVARCHAR(200);
EXEC dbo.sp_RegisterUser
    @FullName='Bad User',
    @Email='bad_viewtxn@example.com',
    @Username='badviewtxn',
    @PasswordHash='short_hash',
    @UserId=@BadUserId OUTPUT,
    @Message=@BadMsg OUTPUT;
PRINT @BadMsg;

SELECT UserId, Email, Username
FROM dbo.Users
WHERE Email IN ('viewtxn@example.com', 'bad_viewtxn@example.com');
GO

PRINT 'STEP 2: Transaction demo with sp_CreateOrUpdateUserProfile';
DECLARE @TargetUserId INT, @ProfileMsg NVARCHAR(200);
SELECT @TargetUserId = UserId FROM dbo.Users WHERE Email='viewtxn@example.com';

-- Good update (commit)
EXEC dbo.sp_CreateOrUpdateUserProfile
    @UserId=@TargetUserId,
    @Bio='Short bio - this should save',
    @City='Lahore',
    @ProfileImageUrl='https://example.com/profile.jpg',
    @Message=@ProfileMsg OUTPUT;
PRINT @ProfileMsg;
GO

PRINT 'STEP 2B: Bad profile update (rollback expected)';
DECLARE @TargetUserId2 INT, @ProfileMsg2 NVARCHAR(200);
DECLARE @LongBio NVARCHAR(360) = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
SELECT @TargetUserId2 = UserId FROM dbo.Users WHERE Email='viewtxn@example.com';

-- Bad update (rollback; bio too long)
EXEC dbo.sp_CreateOrUpdateUserProfile
    @UserId=@TargetUserId2,
    @Bio=@LongBio,
    @City='Karachi',
    @ProfileImageUrl='https://example.com/should-not-save.jpg',
    @Message=@ProfileMsg2 OUTPUT;
PRINT @ProfileMsg2;

SELECT UserId, Bio, City, ProfileImageUrl
FROM dbo.UserProfiles
WHERE UserId=@TargetUserId2;
GO

PRINT 'STEP 3: Transaction flow in sp_LoginUser';
DECLARE @OutUserId INT, @SessionId UNIQUEIDENTIFIER, @LoginMsg NVARCHAR(200);
DECLARE @GoodHash NVARCHAR(64) = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
DECLARE @WrongHash NVARCHAR(64) = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';

-- Reset state
UPDATE dbo.Users
SET FailedLoginCount=0, IsLocked=0
WHERE Email='viewtxn@example.com';

-- Wrong password hash 3 times
EXEC dbo.sp_LoginUser
    @Email='viewtxn@example.com',
    @PasswordHash=@WrongHash,
    @UserId=@OutUserId OUTPUT,
    @SessionId=@SessionId OUTPUT,
    @Message=@LoginMsg OUTPUT;
PRINT @LoginMsg;

EXEC dbo.sp_LoginUser
    @Email='viewtxn@example.com',
    @PasswordHash=@WrongHash,
    @UserId=@OutUserId OUTPUT,
    @SessionId=@SessionId OUTPUT,
    @Message=@LoginMsg OUTPUT;
PRINT @LoginMsg;

EXEC dbo.sp_LoginUser
    @Email='viewtxn@example.com',
    @PasswordHash=@WrongHash,
    @UserId=@OutUserId OUTPUT,
    @SessionId=@SessionId OUTPUT,
    @Message=@LoginMsg OUTPUT;
PRINT @LoginMsg;

-- Should now be locked
EXEC dbo.sp_LoginUser
    @Email='viewtxn@example.com',
    @PasswordHash=@GoodHash,
    @UserId=@OutUserId OUTPUT,
    @SessionId=@SessionId OUTPUT,
    @Message=@LoginMsg OUTPUT;
PRINT @LoginMsg;

SELECT UserId, Email, FailedLoginCount, IsLocked
FROM dbo.Users
WHERE Email='viewtxn@example.com';
GO

PRINT 'STEP 4: Views demo';

PRINT 'vw_UserPublicProfile';
SELECT TOP 5 * FROM dbo.vw_UserPublicProfile ORDER BY UserId DESC;

PRINT 'vw_LoginAttemptSummary';
SELECT TOP 10 * FROM dbo.vw_LoginAttemptSummary ORDER BY LastAttemptAt DESC;

PRINT 'vw_ActiveSessions';
SELECT TOP 10 * FROM dbo.vw_ActiveSessions ORDER BY CreatedAt DESC;
GO

PRINT 'Views + transactions demo complete.';
