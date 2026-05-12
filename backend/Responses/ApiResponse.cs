namespace backend.Responses;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Code { get; set; }
    public string? Message  { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };

    public static ApiResponse<T> Fail(string code, string? message = null) =>
        new() { Success = false, Code = code, Message = message };

    public static ApiResponse<T> Fail(string code, T? data, string? message = null) =>
        new() { Success = false, Code = code, Data = data, Message = message };
}

public class ApiResponse : ApiResponse<object>
{
    public new static ApiResponse Ok(object? data = null) => new() { Success = true, Data = data };

    public new static ApiResponse Fail(string code, string? message = null) => new()
    {
        Success = false, Code = code, Message = message
    };
}

public class UserResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Role { get; set; }
}

public class StatusResponse
{
    public bool NeedsRegister { get; set; }
    public bool RegisterEnabled { get; set; }
}

public class ErrorResponse
{
    public string Code { get; set; } = string.Empty;
    public string? Message { get; set; }
}