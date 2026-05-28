using System.Text.Json.Serialization;

namespace Namorix.Core.Data;

public class AppearanceOptionsData
{
    public List<AccentColorData> AccentColors { get; init; } = [];
    public List<SelectOptionData> FontFamilies { get; init; } = [];
    public List<SelectOptionData> Densities { get; init; } = [];
    public List<FontSizeOptionData> FontSizes { get; init; } = [];
    public List<SelectOptionData> Languages { get; init; } = [];
    public List<SelectOptionData> DateFormats { get; init; } = [];

    public static AppearanceOptionsData Default => new()
    {
        AccentColors =
        [
            new AccentColorData { Id = "blue", Color = "#378ADD" },
            new AccentColorData { Id = "green", Color = "#1D9E75" },
            new AccentColorData { Id = "purple", Color = "#7F77DD" },
            new AccentColorData { Id = "orange", Color = "#D85A30" },
            new AccentColorData { Id = "pink", Color = "#D4537E" },
        ],
        FontFamilies =
        [
            new SelectOptionData { Value = "Inter", Label = "Inter" },
            new SelectOptionData { Value = "Geist", Label = "Geist" },
            new SelectOptionData { Value = "JetBrains Mono", Label = "JetBrains Mono" },
            new SelectOptionData { Value = "system", Label = "System default" },
        ],
        Densities =
        [
            new SelectOptionData { Value = "compact", Label = "Compact" },
            new SelectOptionData { Value = "default", Label = "Default" },
            new SelectOptionData { Value = "spacious", Label = "Spacious" },
        ],
        FontSizes =
        [
            new FontSizeOptionData { Value = "sm", Label = "Aa" },
            new FontSizeOptionData { Value = "md", Label = "Aa" },
            new FontSizeOptionData { Value = "lg", Label = "Aa" },
        ],
        Languages =
        [
            new SelectOptionData { Value = "en", Label = "English" },
            new SelectOptionData { Value = "vi", Label = "Tiếng Việt" },
        ],
        DateFormats =
        [
            new SelectOptionData { Value = "DD/MM/YYYY", Label = "DD/MM/YYYY" },
            new SelectOptionData { Value = "MM/DD/YYYY", Label = "MM/DD/YYYY" },
            new SelectOptionData { Value = "YYYY-MM-DD", Label = "YYYY-MM-DD" },
        ],
    };
}

public class AccentColorData
{
    public string Id { get; init; } = string.Empty;
    public string Color { get; init; } = string.Empty;
}

public class SelectOptionData
{
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
}

public class FontSizeOptionData
{
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
}