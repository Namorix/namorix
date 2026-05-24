namespace Namorix.Adapters.Filters;

public static class TrafficLogFilterParser
{
    public static TrafficLogFilter Parse(
        int page, int pageSize, int? endpointId,
        DateTime? from, DateTime? to, string? search)
    {
        var filter = new TrafficLogFilter
        {
            Page = Math.Max(1, page),
            PageSize = Math.Clamp(pageSize, 1, 200),
            EndpointId = endpointId,
            From = from,
            To = to,
        };

        if (string.IsNullOrWhiteSpace(search))
            return filter;

        var tokens = search.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        foreach (var token in tokens)
        {
            var sep = token.IndexOf('=');
            if (sep is <= 0 or > 2) continue;

            var key = token[..sep].ToLowerInvariant();
            var val = token[(sep + 1)..];

            switch (key)
            {
                case "m":
                    filter = filter with { Method = val };
                    break;
                case "p":
                    filter = filter with { Path = val };
                    break;
                case "ip":
                    filter = filter with { Ip = val };
                    break;
                case "s":
                    ParseStatus(val, ref filter);
                    break;
                case "t":
                    ParseTime(val, ref filter);
                    break;
                case "d":
                    ParseDate(val, ref filter);
                    break;
            }
        }

        return filter;
    }

    private static void ParseStatus(string val, ref TrafficLogFilter filter)
    {
        switch (val.Length)
        {
            case 3 when int.TryParse(val, out var code):
                filter = filter with { StatusCode = code };
                return;
            case 3 when val[2] == 'x' && int.TryParse(val[..1], out var hundred):
                filter = filter with
                {
                    StatusCodeMin = hundred * 100,
                    StatusCodeMax = hundred * 100 + 99
                };
                break;
        }
    }

    private static void ParseTime(string val, ref TrafficLogFilter filter)
    {
        var dateStr = val[0] is '>' or '<' ? val[1..] : val;

        if (TimeOnly.TryParse(dateStr, out var timeOnly))
        {
            var localDt = DateTime.Today.Add(timeOnly.ToTimeSpan());
            var utcDt = TimeZoneInfo.ConvertTimeToUtc(localDt, TimeZoneInfo.Local);

            filter = val[0] switch
            {
                '>' => filter with { From = utcDt },
                '<' => filter with { To = utcDt },
                _ => filter with { From = utcDt.AddSeconds(-1), To = utcDt.AddSeconds(1) }
            };
            return;
        }
        
        var op = val[0] is '>' or '<' ? val[0] : '=';
        var fullStr = op == '=' ? val : val[1..];
        if (!DateTime.TryParse(fullStr, out var dt)) return;
        if (dt.Kind == DateTimeKind.Unspecified)
            dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        filter = op switch
        {
            '>' => filter with { From = dt },
            '<' => filter with { To = dt },
            _ => filter
        };
    }

    private static void ParseDate(string val, ref TrafficLogFilter filter)
    {
        var dateStr = val[0] is '>' or '<' ? val[1..] : val;
        if (!DateTime.TryParse(dateStr, out var dt)) return;

        if (dt.Kind == DateTimeKind.Unspecified)
            dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        switch (val[0])
        {
            case '>':
                filter = filter with { From = dt.Date };
                break;
            case '<':
                filter = filter with { To = dt.Date.AddDays(1).AddTicks(-1) };
                break;
            default:
            {
                var fromTime = filter.From?.TimeOfDay ?? TimeSpan.Zero;
                var toTime = filter.To?.TimeOfDay ?? new TimeSpan(23, 59, 59);

                filter = filter with
                {
                    From = dt.Date.Add(fromTime),
                    To = dt.Date.Add(toTime)
                };
                break;
            }
        }
    }
}