#!/bin/bash

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

SEED=$1
RANGE=$2

# Detecta o diretório base para não errar o caminho do node
BASE_DIR=$(pwd)

if [ -z "$SEED" ] || [ -z "$RANGE" ]; then
    echo "Uso: ./stress_test.sh [seed] [quantidade]"
    exit 1
fi

echo "--- Coleta Bruta: Iniciando extração na veia ---"

for (( i=0; i<$RANGE; i++ )); do
    # Correção da sintaxe Python para gerar o ID Base36 de forma robusta
    target_id=$(python3 -c "
import string
chars = string.digits + string.ascii_lowercase
n = int('$SEED', 36) + $i
if n == 0:
    print('0')
else:
    res = []
    while n:
        n, r = divmod(n, 36)
        res.append(chars[r])
    print(''.join(reversed(res)))
")

    echo -e "${GREEN}>>> MINEIRANDO ID: $target_id${NC}"
    
    # Executa usando o caminho absoluto detectado
    node "miner_jpi.js" "$target_id"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}!!! BLOQUEIO OU ARQUIVO NÃO ENCONTRADO NO ID $target_id !!!${NC}"
        exit 1
    fi
    
    if [ -f "../../0/metrics.json" ]; then
        total=$(grep -oP '"total": \K\d+' ../../0/metrics.json)
        blocked=$(grep -oP '"blocked": \K\d+' ../../0/metrics.json)
        echo -e "${YELLOW}Metas: Total=$total | Bloqueios=$blocked${NC}"
    fi

    # Delay de 0.5s para respirar
    sleep 2
done
