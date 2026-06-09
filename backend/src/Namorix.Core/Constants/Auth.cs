namespace Namorix.Core.Constants;

public static class AuthConstraints
{
    public const int UsernameMinLength = 3;
    public const int UsernameMaxLength = 32;
    public const int PasswordMinLength = 6;
    public const int EmailMaxLength = 254;
    public const int NameMinLength = 1;
    public const int NameMaxLength = 100;
    public const string EmailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$";
}
