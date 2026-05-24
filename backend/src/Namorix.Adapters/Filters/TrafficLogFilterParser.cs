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
        var normalized = dateStr.Contains(':') ? dateStr : dateStr + ":00";

        if (TimeOnly.TryParse(normalized, out var timeOnly))
        {
            var utcDt = DateTime.Today.Add(timeOnly.ToTimeSpan());
            utcDt = DateTime.SpecifyKind(utcDt, DateTimeKind.Utc);
            
            switch (val[0])
            {
                case '>':
                    filter = filter with { From = utcDt }; return;
                case '<':
                    filter = filter with { To = utcDt }; return;
            }

            var parts = dateStr.Split(':');
            var (from, to) = parts.Length switch
            {
                1 => (utcDt, utcDt.AddHours(1).AddTicks(-1)),        // t=16
                2 => (utcDt, utcDt.AddMinutes(1).AddTicks(-1)),      // t=16:20
                _ => (utcDt.AddSeconds(-1), utcDt.AddSeconds(1))     // t=16:20:30
            };

            filter = filter with { From = from, To = to };
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
        
        if (dateStr.Length == 4 && int.TryParse(dateStr, out var year))
        {
            var from = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var to   = new DateTime(year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddTicks(-1);
            ApplyRange(val[0], from, to, ref filter);
            return;
        }
        
        var sep = dateStr.IndexOfAny(['/', '-']);
        if (sep > 0)
        {
            var left  = dateStr[..sep];
            var right = dateStr[(sep + 1)..];

            if (right.IndexOfAny(['/', '-']) < 0
                && int.TryParse(left, out var y)
                && int.TryParse(right, out var m)
                && m is >= 1 and <= 12)
            {
                var from = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
                var to   = from.AddMonths(1).AddTicks(-1);
                ApplyRange(val[0], from, to, ref filter);
                return;
            }
        }
        
        if (!DateTime.TryParse(dateStr, out var dt)) return;
        if (dt.Kind == DateTimeKind.Unspecified)
            dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        var date = DateTime.SpecifyKind(dt.Date, DateTimeKind.Utc);
        switch (val[0])
        {
            case '>':
                filter = filter with { From = date };
                break;
            case '<':
                filter = filter with { To = date.AddDays(1).AddTicks(-1) };
                break;
            default:
                var fromTime = filter.From?.TimeOfDay ?? TimeSpan.Zero;
                var toTime   = filter.To?.TimeOfDay   ?? new TimeSpan(23, 59, 59);
                filter = filter with
                {
                    From = date.Add(fromTime),
                    To   = date.Add(toTime)
                };
                break;
        }
    }

    private static void ApplyRange(char prefix, DateTime from, DateTime to, ref TrafficLogFilter filter)
    {
        filter = prefix switch
        {
            '>' => filter with { From = from },
            '<' => filter with { To = to },
            _   => filter with { From = from, To = to }
        };
    }
}