#!/usr/bin/env bash
set -e

# Build a JDBC URL from Railway MySQL variables when DB_URL is not set.
if [[ -z "${DB_URL}" ]]; then
  if [[ -n "${MYSQL_URL}" ]]; then
    # Railway gives mysql://user:pass@host:port/db — Spring needs jdbc:mysql://...
    case "${MYSQL_URL}" in
      jdbc:*) export DB_URL="${MYSQL_URL}" ;;
      mysql://*) export DB_URL="jdbc:${MYSQL_URL}" ;;
      *) export DB_URL="jdbc:mysql://${MYSQL_URL}" ;;
    esac
  elif [[ -n "${MYSQLHOST}" ]]; then
    export DB_URL="jdbc:mysql://${MYSQLHOST}:${MYSQLPORT:-3306}/${MYSQLDATABASE:-railway}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
  fi
fi

if [[ -z "${DB_USERNAME}" && -n "${MYSQLUSER}" ]]; then
  export DB_USERNAME="${MYSQLUSER}"
fi
if [[ -z "${DB_PASSWORD}" && -n "${MYSQLPASSWORD}" ]]; then
  export DB_PASSWORD="${MYSQLPASSWORD}"
fi

if [[ -z "${DB_URL}" ]]; then
  echo "ERROR: No database configured."
  echo "On Railway: open this service → Variables → Add Variable Reference"
  echo "and link MYSQLHOST / MYSQLPORT / MYSQLUSER / MYSQLPASSWORD / MYSQLDATABASE"
  echo "from your MySQL service (or set DB_URL manually)."
  exit 1
fi

echo "Using DB_URL host from: ${DB_URL%%\?*}"

# Wait until MySQL accepts TCP connections.
HOST="${MYSQLHOST}"
PORT="${MYSQLPORT:-3306}"
if [[ -z "${HOST}" && "${DB_URL}" =~ @([^:/]+):([0-9]+) ]]; then
  HOST="${BASH_REMATCH[1]}"
  PORT="${BASH_REMATCH[2]}"
elif [[ -z "${HOST}" && "${DB_URL}" =~ jdbc:mysql://([^:/]+):([0-9]+) ]]; then
  HOST="${BASH_REMATCH[1]}"
  PORT="${BASH_REMATCH[2]}"
fi

if [[ -n "${HOST}" ]]; then
  echo "Waiting for MySQL at ${HOST}:${PORT}..."
  for ((i=1; i<=90; i++)); do
    if (echo >/dev/tcp/"${HOST}"/"${PORT}") >/dev/null 2>&1; then
      echo "MySQL is ready."
      break
    fi
    if [[ "$i" -eq 90 ]]; then
      echo "ERROR: MySQL at ${HOST}:${PORT} never became reachable."
      exit 1
    fi
    sleep 2
  done
fi

exec java ${JAVA_OPTS} -jar /app/app.jar
