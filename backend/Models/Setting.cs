using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Setting
{
    public int Id { get; init; }
    
    [MaxLength(100)]
    public string Key { get; init; } = string.Empty;
    
    [MaxLength(100)]
    public string Value { get; set; } = string.Empty;
}