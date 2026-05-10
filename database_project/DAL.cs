using System;
using System.Data;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;

namespace DilgorithmDatabaseProject
{
    public sealed class AuthDal
    {
        private readonly string _connectionString;

        public AuthDal(string connectionString)
        {
            _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
        }

        public AuthResult SignUp(string fullName, string email, string username, string password)
        {
            if (string.IsNullOrWhiteSpace(fullName) || fullName.Trim().Length < 3)
                return AuthResult.Fail("Full name must be at least 3 characters.");
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
                return AuthResult.Fail("Please enter a valid email.");
            if (string.IsNullOrWhiteSpace(username) || username.Trim().Length < 4)
                return AuthResult.Fail("Username must be at least 4 characters.");
            if (!IsPasswordStrong(password))
                return AuthResult.Fail("Password must be at least 8 characters and include upper, lower, number, and special character.");

            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand("dbo.sp_RegisterUser", connection)
            {
                CommandType = CommandType.StoredProcedure
            };

            command.Parameters.AddWithValue("@FullName", fullName.Trim());
            command.Parameters.AddWithValue("@Email", email.Trim().ToLowerInvariant());
            command.Parameters.AddWithValue("@Username", username.Trim());
            command.Parameters.AddWithValue("@PasswordHash", HashPassword(password));

            var userIdParam = new SqlParameter("@UserId", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var messageParam = new SqlParameter("@Message", SqlDbType.NVarChar, 200) { Direction = ParameterDirection.Output };
            command.Parameters.Add(userIdParam);
            command.Parameters.Add(messageParam);

            connection.Open();
            command.ExecuteNonQuery();

            var message = messageParam.Value?.ToString() ?? "Signup failed.";
            if (int.TryParse(userIdParam.Value?.ToString(), out var userId) && userId > 0)
                return AuthResult.Success(userId, null, message);

            return AuthResult.Fail(message);
        }

        public AuthResult Login(string email, string password)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
                return AuthResult.Fail("Please enter a valid email.");
            if (string.IsNullOrWhiteSpace(password))
                return AuthResult.Fail("Password is required.");

            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand("dbo.sp_LoginUser", connection)
            {
                CommandType = CommandType.StoredProcedure
            };

            command.Parameters.AddWithValue("@Email", email.Trim().ToLowerInvariant());
            command.Parameters.AddWithValue("@PasswordHash", HashPassword(password));

            var userIdParam = new SqlParameter("@UserId", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var sessionIdParam = new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier) { Direction = ParameterDirection.Output };
            var messageParam = new SqlParameter("@Message", SqlDbType.NVarChar, 200) { Direction = ParameterDirection.Output };
            command.Parameters.Add(userIdParam);
            command.Parameters.Add(sessionIdParam);
            command.Parameters.Add(messageParam);

            connection.Open();
            command.ExecuteNonQuery();

            var message = messageParam.Value?.ToString() ?? "Login failed.";
            if (int.TryParse(userIdParam.Value?.ToString(), out var userId) && userId > 0
                && Guid.TryParse(sessionIdParam.Value?.ToString(), out var sessionId))
            {
                return AuthResult.Success(userId, sessionId, message);
            }

            return AuthResult.Fail(message);
        }

        private static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            var sb = new StringBuilder(hashBytes.Length * 2);
            foreach (var b in hashBytes)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }

        private static bool IsPasswordStrong(string? password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                return false;

            var hasUpper = false;
            var hasLower = false;
            var hasDigit = false;
            var hasSpecial = false;

            foreach (var ch in password)
            {
                if (char.IsUpper(ch)) hasUpper = true;
                else if (char.IsLower(ch)) hasLower = true;
                else if (char.IsDigit(ch)) hasDigit = true;
                else hasSpecial = true;
            }

            return hasUpper && hasLower && hasDigit && hasSpecial;
        }
    }

    public sealed class AuthResult
    {
        public bool IsSuccess { get; init; }
        public int? UserId { get; init; }
        public Guid? SessionId { get; init; }
        public string Message { get; init; } = string.Empty;

        public static AuthResult Success(int userId, Guid? sessionId, string message) =>
            new AuthResult { IsSuccess = true, UserId = userId, SessionId = sessionId, Message = message };

        public static AuthResult Fail(string message) =>
            new AuthResult { IsSuccess = false, Message = message };
    }
}
