using Microsoft.AspNetCore.Mvc;

namespace DilgorithmDatabaseProject
{
    public class AuthController : Controller
    {
        private readonly AuthDal _dal;

        // Update this connection string for your SQL Server setup.
        private const string ConnectionString =
            "Server=localhost;Database=DilgorithmAuthDB;Trusted_Connection=True;TrustServerCertificate=True;";

        public AuthController()
        {
            _dal = new AuthDal(ConnectionString);
        }

        [HttpGet]
        public IActionResult Login() => View();

        [HttpPost]
        public IActionResult Login(LoginRequest request)
        {
            if (!ModelState.IsValid)
                return View(request);

            var result = _dal.Login(request.Email, request.Password);
            if (result.IsSuccess)
            {
                // Login successful -> redirect to dummy user profile page.
                return RedirectToAction("DummyProfile", new { userId = result.UserId });
            }

            ModelState.AddModelError(string.Empty, result.Message);
            return View(request);
        }

        [HttpGet]
        public IActionResult Signup() => View();

        [HttpPost]
        public IActionResult Signup(SignupRequest request)
        {
            if (!ModelState.IsValid)
                return View(request);

            var result = _dal.SignUp(request.FullName, request.Email, request.Username, request.Password);
            if (result.IsSuccess)
            {
                // Signup successful -> redirect to same dummy profile page.
                return RedirectToAction("DummyProfile", new { userId = result.UserId });
            }

            ModelState.AddModelError(string.Empty, result.Message);
            return View(request);
        }

        [HttpGet]
        public IActionResult DummyProfile(int userId)
        {
            ViewBag.UserId = userId;
            return View();
        }
    }

    public sealed class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public sealed class SignupRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
