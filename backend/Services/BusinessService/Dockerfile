# Étape 1 : build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["BusinessService.csproj", "./"]
RUN dotnet restore "BusinessService.csproj"

COPY . .
RUN dotnet publish "BusinessService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Étape 2 : runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BusinessService.dll"]