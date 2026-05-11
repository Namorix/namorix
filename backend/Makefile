db_migrate:
	@if [ -z "$(name)" ]; then \
		echo "Error: Migration name is required. Usage: make db_migrate name=MigrationName"; \
		exit 1; \
	fi
	dotnet ef migrations add $(name)
db_update:
	dotnet ef database update
watch:
	dotnet watch run
watch_test:
	dotnet watch test
