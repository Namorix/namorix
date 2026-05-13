using backend.Constants;

namespace backend.Responses;

public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Code { get; init; }
    public string? Error { get; init; }
    public string? Field { get; init; }
    public ValidationMeta? Meta { get; init; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    
    public static ApiResponse<T> Fail(string code, string? error = null, string? field = null, ValidationMeta? meta = null) =>
        new() { Success = false, Code = code, Error = error, Field = field, Meta = meta};
}

public class ApiResponse : ApiResponse<object>
{
    public new static ApiResponse Ok(object? data = null) => new() { Success = true, Data = data };
    
    public new static ApiResponse Fail(string code, string? error = null, string? field = null, ValidationMeta? meta = null) => new()
    {
        Success = false, Code = code, Error = error, Field = field, Meta = meta
    };
}

public class UserResponse
{
    public int Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public int Role { get; init; }
}

public class StatusResponse
{
    public bool NeedsRegister { get; init; }
    public bool RegisterEnabled { get; init; }
}

public class ErrorResponse
{
    public string Code { get; init; } = string.Empty;
    public string? Message { get; init; }
}