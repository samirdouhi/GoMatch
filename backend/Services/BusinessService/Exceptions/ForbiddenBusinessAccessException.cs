namespace BusinessService.Exceptions
{
    public class ForbiddenBusinessAccessException : Exception
    {
        public ForbiddenBusinessAccessException()
            : base("Accès interdit à cette ressource.")
        {
        }

        public ForbiddenBusinessAccessException(string message)
            : base(message)
        {
        }

        public ForbiddenBusinessAccessException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}