-- =============================================
-- Dilgorithm DB Project (SQL Server)
-- Includes:
--   - Tables + constraints
--   - 4 stored procedures (>= 3 required)
--   - Explicit transactions in procedures (>= 3 required)
--   - 3 views
--   - 3 triggers
-- =============================================

IF DB_ID('DilgorithmDB') IS NULL
BEGIN
    CREATE DATABASE DilgorithmDB;
END
GO

USE DilgorithmDB;
GO

-- Drop objects for repeatable script execution
IF OBJECT_ID('dbo.trg_UserProfiles_AfterInsert', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_UserProfiles_AfterInsert;
IF OBJECT_ID('dbo.trg_Users_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_Users_UpdateTimestamp;
IF OBJECT_ID('dbo.trg_FailedLogin_AutoLockUser', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_FailedLogin_AutoLockUser;
GO

IF OBJECT_ID('dbo.vw_ActiveSessions', 'V') IS NOT NULL DROP VIEW dbo.vw_ActiveSessions;
IF OBJECT_ID('dbo.vw_LoginAttemptSummary', 'V') IS NOT NULL DROP VIEW dbo.vw_LoginAttemptSummary;
IF OBJECT_ID('dbo.vw_UserPublicProfile', 'V') IS NOT NULL DROP VIEW dbo.vw_UserPublicProfile;
GO

IF OBJECT_ID('dbo.sp_UnlockUser', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_UnlockUser;
IF OBJECT_ID('dbo.sp_CreateOrUpdateUserProfile', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_CreateOrUpdateUserProfile;
IF OBJECT_ID('dbo.sp_LoginUser', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_LoginUser;
IF OBJECT_ID('dbo.sp_RegisterUser', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_RegisterUser;
GO

IF OBJECT_ID('dbo.ActiveSessions', 'U') IS NOT NULL DROP TABLE dbo.ActiveSessions;
IF OBJECT_ID('dbo.UserProfileAudit', 'U') IS NOT NULL DROP TABLE dbo.UserProfileAudit;
IF OBJECT_ID('dbo.FailedLoginAudit', 'U') IS NOT NULL DROP TABLE dbo.FailedLoginAudit;
IF OBJECT_ID('dbo.UserProfiles', 'U') IS NOT NULL DROP TABLE dbo.UserProfiles;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE dbo.Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(256) NOT NULL,
    IsLocked BIT NOT NULL CONSTRAINT DF_Users_IsLocked DEFAULT (0),
    FailedLoginCount INT NOT NULL CONSTRAINT DF_Users_FailedLoginCount DEFAULT (0),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Users_EmailFormat CHECK (Email LIKE '%_@_%._%'),
    CONSTRAINT CK_Users_UsernameLength CHECK (LEN(Username) >= 4),
    CONSTRAINT CK_Users_PasswordHashLen CHECK (LEN(PasswordHash) >= 64)
);
GO

CREATE TABLE dbo.UserProfiles (
    ProfileId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    Bio NVARCHAR(350) NULL,
    City NVARCHAR(80) NULL,
    ProfileImageUrl NVARCHAR(400) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserProfiles_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserProfiles_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_UserProfiles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.FailedLoginAudit (
    AuditId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    EmailTried NVARCHAR(150) NOT NULL,
    AttemptedAt DATETIME2 NOT NULL CONSTRAINT DF_FailedLoginAudit_AttemptedAt DEFAULT (SYSUTCDATETIME()),
    Reason NVARCHAR(200) NOT NULL,
    CONSTRAINT FK_FailedLoginAudit_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);
GO

CREATE TABLE dbo.ActiveSessions (
    SessionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    UserId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ActiveSessions_CreatedAt DEFAULT (SYSUTCDATETIME()),
    ExpiresAt DATETIME2 NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_ActiveSessions_IsActive DEFAULT (1),
    CONSTRAINT FK_ActiveSessions_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.UserProfileAudit (
    AuditId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ActionType NVARCHAR(20) NOT NULL,
    ActionAt DATETIME2 NOT NULL CONSTRAINT DF_UserProfileAudit_ActionAt DEFAULT (SYSUTCDATETIME()),
    SnapshotBio NVARCHAR(350) NULL,
    SnapshotCity NVARCHAR(80) NULL,
    CONSTRAINT FK_UserProfileAudit_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

-- ===============================
-- Stored procedures (with transactions)
-- ===============================

CREATE PROCEDURE dbo.sp_RegisterUser
    @FullName NVARCHAR(100),
    @Email NVARCHAR(150),
    @Username NVARCHAR(50),
    @PasswordHash NVARCHAR(256),
    @UserId INT OUTPUT,
    @Message NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Basic backend validations
        IF LEN(LTRIM(RTRIM(@FullName))) < 3
            THROW 50001, 'Full name must be at least 3 characters.', 1;
        IF @Email NOT LIKE '%_@_%._%'
            THROW 50002, 'Invalid email format.', 1;
        IF LEN(LTRIM(RTRIM(@Username))) < 4
            THROW 50003, 'Username must be at least 4 characters.', 1;
        IF LEN(@PasswordHash) < 64
            THROW 50004, 'Password hash is invalid.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Users WHERE Email = @Email)
            THROW 50005, 'Email already exists.', 1;
        IF EXISTS (SELECT 1 FROM dbo.Users WHERE Username = @Username)
            THROW 50006, 'Username already exists.', 1;

        INSERT INTO dbo.Users (FullName, Email, Username, PasswordHash)
        VALUES (@FullName, @Email, @Username, @PasswordHash);

        SET @UserId = SCOPE_IDENTITY();

        INSERT INTO dbo.UserProfiles (UserId, Bio, City, ProfileImageUrl)
        VALUES (@UserId, NULL, NULL, NULL);

        SET @Message = 'Signup successful.';
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @UserId = NULL;
        SET @Message = ERROR_MESSAGE();
    END CATCH
END
GO

CREATE PROCEDURE dbo.sp_LoginUser
    @Email NVARCHAR(150),
    @PasswordHash NVARCHAR(256),
    @UserId INT OUTPUT,
    @SessionId UNIQUEIDENTIFIER OUTPUT,
    @Message NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Locked BIT = 0;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Email NOT LIKE '%_@_%._%'
            THROW 50011, 'Invalid email format.', 1;
        IF LEN(@PasswordHash) < 64
            THROW 50012, 'Password hash is invalid.', 1;

        SELECT @UserId = UserId, @Locked = IsLocked
        FROM dbo.Users
        WHERE Email = @Email;

        IF @UserId IS NULL
        BEGIN
            INSERT INTO dbo.FailedLoginAudit (UserId, EmailTried, Reason)
            VALUES (NULL, @Email, 'User does not exist');
            SET @Message = 'Invalid credentials.';
            SET @SessionId = NULL;
            SET @UserId = NULL;
            COMMIT TRANSACTION;
            RETURN;
        END

        IF @Locked = 1
        BEGIN
            SET @Message = 'Account is locked due to multiple failed login attempts.';
            SET @SessionId = NULL;
            SET @UserId = NULL;
            COMMIT TRANSACTION;
            RETURN;
        END

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Users
            WHERE UserId = @UserId AND PasswordHash = @PasswordHash
        )
        BEGIN
            UPDATE dbo.Users
            SET FailedLoginCount = FailedLoginCount + 1
            WHERE UserId = @UserId;

            INSERT INTO dbo.FailedLoginAudit (UserId, EmailTried, Reason)
            VALUES (@UserId, @Email, 'Incorrect password');

            SET @Message = 'Invalid credentials.';
            SET @SessionId = NULL;
            SET @UserId = NULL;
            COMMIT TRANSACTION;
            RETURN;
        END

        UPDATE dbo.Users
        SET FailedLoginCount = 0
        WHERE UserId = @UserId;

        SET @SessionId = NEWID();
        INSERT INTO dbo.ActiveSessions (SessionId, UserId, ExpiresAt, IsActive)
        VALUES (@SessionId, @UserId, DATEADD(HOUR, 2, SYSUTCDATETIME()), 1);

        SET @Message = 'Login successful.';
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @SessionId = NULL;
        SET @UserId = NULL;
        SET @Message = ERROR_MESSAGE();
    END CATCH
END
GO

CREATE PROCEDURE dbo.sp_CreateOrUpdateUserProfile
    @UserId INT,
    @Bio NVARCHAR(350),
    @City NVARCHAR(80),
    @ProfileImageUrl NVARCHAR(400),
    @Message NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = @UserId)
            THROW 50021, 'User does not exist.', 1;

        IF LEN(ISNULL(@Bio, '')) > 350
            THROW 50022, 'Bio exceeds allowed length.', 1;

        IF EXISTS (SELECT 1 FROM dbo.UserProfiles WHERE UserId = @UserId)
        BEGIN
            UPDATE dbo.UserProfiles
            SET Bio = @Bio,
                City = @City,
                ProfileImageUrl = @ProfileImageUrl,
                UpdatedAt = SYSUTCDATETIME()
            WHERE UserId = @UserId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.UserProfiles (UserId, Bio, City, ProfileImageUrl)
            VALUES (@UserId, @Bio, @City, @ProfileImageUrl);
        END

        SET @Message = 'Profile saved.';
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Message = ERROR_MESSAGE();
    END CATCH
END
GO

CREATE PROCEDURE dbo.sp_UnlockUser
    @Email NVARCHAR(150),
    @Message NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users
    SET IsLocked = 0, FailedLoginCount = 0
    WHERE Email = @Email;

    IF @@ROWCOUNT = 0
        SET @Message = 'User not found.';
    ELSE
        SET @Message = 'User unlocked successfully.';
END
GO

-- ===============================
-- Views (3 required)
-- ===============================

CREATE VIEW dbo.vw_UserPublicProfile
AS
SELECT
    u.UserId,
    u.FullName,
    u.Username,
    u.Email,
    u.CreatedAt,
    p.Bio,
    p.City,
    p.ProfileImageUrl
FROM dbo.Users u
LEFT JOIN dbo.UserProfiles p ON p.UserId = u.UserId;
GO

CREATE VIEW dbo.vw_LoginAttemptSummary
AS
SELECT
    COALESCE(u.Email, f.EmailTried) AS Email,
    COUNT(*) AS FailedAttempts,
    MAX(f.AttemptedAt) AS LastAttemptAt
FROM dbo.FailedLoginAudit f
LEFT JOIN dbo.Users u ON u.UserId = f.UserId
GROUP BY COALESCE(u.Email, f.EmailTried);
GO

CREATE VIEW dbo.vw_ActiveSessions
AS
SELECT
    s.SessionId,
    s.UserId,
    u.Username,
    u.Email,
    s.CreatedAt,
    s.ExpiresAt
FROM dbo.ActiveSessions s
JOIN dbo.Users u ON u.UserId = s.UserId
WHERE s.IsActive = 1 AND s.ExpiresAt > SYSUTCDATETIME();
GO

-- ===============================
-- Triggers (3 required)
-- ===============================

CREATE TRIGGER dbo.trg_Users_UpdateTimestamp
ON dbo.Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
    SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.Users u
    INNER JOIN inserted i ON i.UserId = u.UserId;
END
GO

CREATE TRIGGER dbo.trg_FailedLogin_AutoLockUser
ON dbo.FailedLoginAudit
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
    SET IsLocked = 1
    FROM dbo.Users u
    WHERE u.UserId IN (
        SELECT i.UserId
        FROM inserted i
        WHERE i.UserId IS NOT NULL
    )
    AND u.FailedLoginCount >= 3;
END
GO

CREATE TRIGGER dbo.trg_UserProfiles_AfterInsert
ON dbo.UserProfiles
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.UserProfileAudit (UserId, ActionType, SnapshotBio, SnapshotCity)
    SELECT i.UserId, 'INSERT', i.Bio, i.City
    FROM inserted i;
END
GO
