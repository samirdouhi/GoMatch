FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["NotificationService.csproj", "./"]
RUN dotnet restore "NotificationService.csproj"

COPY . .
RUN dotnet publish "NotificationService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "NotificationService.dll"]
