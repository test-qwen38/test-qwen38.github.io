
## Имя проекта Docker Compose (используется как префикс для контейнеров, сетей, volume'ов)
COMPOSE_PROJECT_NAME=test-qwen

MAIN_URL='http://localhost:64600'

SUCCESS_MESSAGE='You can now access: $(MAIN_URL)'

## Путь к используемому docker-compose файлу (например, для dev-среды)
COMPOSE_FILE=.docker/developer/docker-compose.yml

COMPOSE=docker compose -f $(COMPOSE_FILE)

.PHONY: init up down logs

init:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d
	@echo $(SUCCESS_MESSAGE)

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f nginx
