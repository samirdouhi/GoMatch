namespace ProfileService.ErrorHandling.ExceptionMapping;

public interface IExceptionMapper
{
    ExceptionMappingResult Map(Exception exception);
}