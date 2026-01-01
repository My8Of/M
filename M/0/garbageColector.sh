#!/bin/bash

# Cores para beleza visual
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# No Docker, os caminhos devem ser absolutos ou relativos ao WORKDIR
SOURCE_FILE=".links"
TEMP_FILE=".links.tmp"
LOG_FILE="status_fontes.log"

echo "--- Verificação e Limpeza de Fontes $(date) ---" > "$LOG_FILE"
touch "$TEMP_FILE"

while IFS='|' read -r nome url camada; do
    [[ "$nome" =~ ^#.*$ || -z "$nome" ]] && echo "$nome|$url|$camada" >> "$TEMP_FILE" && continue

    status=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 "$url")

    if [ "$status" -eq 200 ] || [ "$status" -eq 301 ]; then
        echo -e "${GREEN}[OK]${NC} $nome ($status)"
        echo "[$(date +%T)] $nome: ATIVA ($status)" >> "$LOG_FILE"
        echo "$nome|$url|$camada" >> "$TEMP_FILE"
    else
        echo -e "${RED}[REMOVENDO]${NC} $nome ($status) - Link quebrado detectado."
        echo "[$(date +%T)] $nome: REMOVIDA ($status)" >> "$LOG_FILE"
    fi
done < "$SOURCE_FILE"

# Substitui o arquivo original pelo limpo
mv "$TEMP_FILE" "$SOURCE_FILE"
echo "Faxina concluída. Relatório salvo em $LOG_FILE"
