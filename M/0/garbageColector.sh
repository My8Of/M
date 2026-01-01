#!/bin/bash

# Cores para beleza visual no terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SOURCE_FILE=".links"
LOG_FILE="status_fontes.log"

echo "--- Verificação de Integridade das Fontes $(date) ---" > "$LOG_FILE"

while IFS='|' read -r nome url camada; do
    # Ignora comentários e linhas vazias
    [[ "$nome" =~ ^#.*$ || -z "$nome" ]] && continue

    # Verifica o status HTTP (timeout de 5s para ser eficiente)
    status=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 "$url")

    if [ "$status" -eq 200 ] || [ "$status" -eq 301 ]; then
        echo -e "${GREEN}[OK]${NC} $nome ($status)"
        echo "[$(date +%T)] $nome: ATIVA ($status)" >> "$LOG_FILE"
    else
        echo -e "${RED}[FAIL]${NC} $nome ($status)"
        echo "[$(date +%T)] $nome: FALHA ($status)" >> "$LOG_FILE"
        # Aqui Moriarty poderia disparar um alerta ou remover a fonte temporariamente
    fi
done < "$SOURCE_FILE"

echo "Relatório salvo em $LOG_FILE"
