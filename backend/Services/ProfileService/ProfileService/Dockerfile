FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["ProfileService.csproj", "./"]
RUN dotnet restore "ProfileService.csproj"

COPY . .
RUN dotnet publish "ProfileService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ProfileService.dll"]
