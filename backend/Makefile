# Variables
EF_MIGRATE = dotnet ef migrations add
EF_UPDATE = dotnet ef database update
EF_REMOVE = dotnet ef migrations remove
EF_DROP   = dotnet ef database drop

# Model-specific Migrations (Clean names)
# Usage: make migrate_user
migrate_user:
	$(EF_MIGRATE) User

# Usage: make migrate_token
migrate_token:
	$(EF_MIGRATE) RefreshToken

# Usage: make migrate_config
migrate_config:
	$(EF_MIGRATE) AppConfig

# Usage: make migrate_setting
migrate_setting:
	$(EF_MIGRATE) Setting

db_init_create:
	$(EF_MIGRATE) InitialCreate

# Database Management
db_update:
	$(EF_UPDATE)

db_rollback:
	$(EF_REMOVE)

db_reset:
	$(EF_DROP) --force
	$(EF_UPDATE)
    
# Run Project
watch:
	dotnet watch run
