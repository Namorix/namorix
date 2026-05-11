namespace backend.Exceptions;

public class AuthException : Exception
{
    public string Code { get; }

    public AuthException(string code) : base(code)
    {
        Code = code;
    }
}