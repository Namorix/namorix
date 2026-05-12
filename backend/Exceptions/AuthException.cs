namespace backend.Exceptions;

public class AuthException(string code) : Exception(code)
{
    public string Code { get; } = code;
}