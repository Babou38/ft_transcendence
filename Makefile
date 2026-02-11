.PHONY: help up down build clean clean-volumes

help:
	@echo "Commandes disponibles:"
	@echo "  make up             - Start the containers"
	@echo "  make down           - Stop the containers"
	@echo "  make build          - Build the Docker images"
	@echo "  make clean          - Stop and delete everything"
	@echo "  make clean-volumes  - Stop and delete only the volumes"

up:
	@if [ ! -f backend/ssl/server.crt ]; then \
		echo "Génération des certificats SSL..."; \
		chmod +x generate-ssl.sh && ./generate-ssl.sh; \
	fi
	@docker compose up -d

down:
	@docker compose down

build:
	@if [ ! -f backend/ssl/server.crt ]; then \
		echo "Génération des certificats SSL..."; \
		chmod +x generate-ssl.sh && ./generate-ssl.sh; \
	fi
	@docker compose build

clean:
	@docker compose down -v --rmi all

clean-volumes:
	@docker compose down -v
