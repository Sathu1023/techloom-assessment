#!/usr/bin/env bash
set -e

# Railway injects MYSQLHOST when a MySQL service is linked.
# Wait until MySQL accepts connections so Spring Boot does not crash on first boot.
if [[ -n "${MYSQLHOST}" ]]; then
  echo "Waiting for MySQL at ${MYSQLHOST}:${MYSQLPORT:-3306}..."
  for ((i=1; i<=60; i++)); do
    if (echo >/dev/tcp/"${MYSQLHOST}"/"${MYSQLPORT:-3306}") >/dev/null 2>&1; then
      echo "MySQL is ready."
      break
    fi
    sleep 2
  done
fi

exec java ${JAVA_OPTS} -jar /app/app.jar
