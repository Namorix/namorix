namespace Namorix.Core.Constants;

public static class SettingKeys
{
    public const string RegisterEnabled = "register_enabled";
    public const string TrustedProxies = "trusted_proxies";
    public const string AllowedOrigins = "allowed_origins";
}

public static class SettingValues
{
    public const string True = "true";
    public const string False = "false";
}

public static class AppearanceSettingKeys
{
    public const string Prefix = "appearance_";
    public const string MemoryCacheKey = "appearance_defaults";
    public const string Theme = "appearance_theme";
    public const string AccentColor = "appearance_accent_color";
    public const string Collapsed = "appearance_collapsed";
    public const string Density = "appearance_density";
    public const string FontFamily = "appearance_font_family";
    public const string FontSize = "appearance_font_size";
    public const string Language = "appearance_language";
    public const string TimeFormat = "appearance_time_format";
    public const string DateFormat = "appearance_date_format";
    
    public static readonly string[] All = [
        Theme, AccentColor, Collapsed, Density,
        FontFamily, FontSize, Language, TimeFormat, DateFormat
    ];
}

public static class AppearanceDefaults
{
    public static readonly Dictionary<string, string> Defaults = new()
    {
        [AppearanceSettingKeys.Theme] = "dark",
        [AppearanceSettingKeys.AccentColor] = "default",
        [AppearanceSettingKeys.Collapsed] = "true",
        [AppearanceSettingKeys.Density] = "default",
        [AppearanceSettingKeys.FontFamily] = "system",
        [AppearanceSettingKeys.FontSize] = "md",
        [AppearanceSettingKeys.Language] = "en",
        [AppearanceSettingKeys.TimeFormat] = "HH:mm",
        [AppearanceSettingKeys.DateFormat] = "DD/MM/YYYY",
    };
}