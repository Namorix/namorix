using System.Collections.Concurrent;
using System.Reflection;
using System.Text.Json;
using Namorix.Core.Constants;
using Namorix.Core.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Namorix.Core.Validation;

[AttributeUsage(AttributeTargets.Method)]
public class ValidateAttribute : ActionFilterAttribute
{
    private Type SchemaType { get; }

    private static readonly ConcurrentDictionary<Type, (object Schema, PropertyInfo[] Properties)> _cache = new();

    public ValidateAttribute(Type schema)
    {
        if (!typeof(IValidationSchema).IsAssignableFrom(schema))
            throw new ArgumentException($"{schema.Name} must implement IValidationSchema");
        SchemaType = schema;
    }

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var (schema, properties) = _cache.GetOrAdd(SchemaType, type =>
        {
            var instance = Activator.CreateInstance(type) ??
                         throw new InvalidOperationException($"Cannot create instance of {SchemaType.Name}");
            var props = SchemaType.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            return (instance, props);
        });

        foreach (var prop in properties)
        {
            if (prop.GetValue(schema) is not ValidationRule rule)
                continue;

            var matchedArg = context.ActionArguments.FirstOrDefault(arg =>
                arg.Key.Equals("request", StringComparison.OrdinalIgnoreCase) ||
                arg.Key.Equals(prop.Name, StringComparison.OrdinalIgnoreCase));

            var argValue = matchedArg.Value != null ? GetPropertyValue(matchedArg.Value, prop.Name) : null;
            var fieldName = JsonNamingPolicy.CamelCase.ConvertName(prop.Name);
            var result = rule.Validate(fieldName, argValue, matchedArg.Value);
            if (result.IsValid)
                continue;
            
            context.HttpContext.Items[HttpContextKeys.Validated] = true;
            context.Result =
                new BadRequestObjectResult(
                    ApiResponse.Fail(result.ErrorCode ?? ValidationErrorCodes.ValidationError, null,
                        result.FieldName, result.Meta));
            return;
        }
        
        base.OnActionExecuting(context);
    }

    private static object? GetPropertyValue(object? obj, string propertyName)
    {
        return obj?.GetType().GetProperty(propertyName)?.GetValue(obj);
    }
}