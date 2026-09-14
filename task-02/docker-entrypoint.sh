#!/usr/bin/env bash
set -e

# Railway variables sometimes include stray whitespace that breaks JDBC hosts.
trim() { echo -n "$1" | tr -d '[:space:]'; }
[[ -n "${MYSQLHOST}" ]] && export MYSQLHOST="$(trim "${MYSQLHOST}")"
[[ -n "${MYSQLPORT}" ]] && export MYSQLPORT="$(trim "${MYSQLPORT}")"
[[ -n "${MYSQLUSER}" ]] && export MYSQLUSER="$(trim "${MYSQLUSER}")"
[[ -n "${MYSQLDATABASE}" ]] && export MYSQLDATABASE="$(trim "${MYSQLDATABASE}")"
[[ -n "${DB_URL}" ]] && export DB_URL="$(echo -n "${DB_URL}" | sed 's/[[:space:]]//g')"
[[ -n "${DB_USERNAME}" ]] && export DB_USERNAME="$(trim "${DB_USERNAME}")"
[[ -n "${MYSQL_URL}" ]] && export MYSQL_URL="$(echo -n "${MYSQL_URL}" | sed 's/[[:space:]]//g')"

# Build a JDBC URL from Railway MySQL variables when DB_URL is not set.
if [[ -z "${DB_URL}" ]]; then
  if [[ -n "${MYSQL_URL}" ]]; then
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
  echo "On Railway: add MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE"
  echo "or set DB_URL / MYSQL_URL on this service."
  exit 1
fi

echo "Using DB_URL host from: ${DB_URL%%\?*}"

# Soft wait only — never crash here. /dev/tcp can fail on some images even when MySQL works.
# Do not overwrite Railway's web PORT (that caused the app to bind 3306 / 8080 incorrectly).
HOST="${MYSQLHOST}"
MYSQL_WAIT_PORT="${MYSQLPORT:-3306}"
if [[ -z "${HOST}" && "${DB_URL}" =~ jdbc:mysql://([^:/]+):([0-9]+) ]]; then
  HOST="${BASH_REMATCH[1]}"
  MYSQL_WAIT_PORT="${BASH_REMATCH[2]}"
fi

if [[ -n "${HOST}" ]]; then
  echo "Waiting briefly for MySQL at ${HOST}:${MYSQL_WAIT_PORT}..."
  for ((i=1; i<=30; i++)); do
    if (echo >/dev/tcp/"${HOST}"/"${MYSQL_WAIT_PORT}") >/dev/null 2>&1; then
      echo "MySQL TCP port is open."
      break
    fi
    sleep 2
  done
fi

WEB_PORT="${PORT}"
if [[ -z "${WEB_PORT}" || "${WEB_PORT}" == "${MYSQLPORT}" ]]; then
  echo "WARNING: web PORT was '${WEB_PORT}'. Using 8080 for the web app."
  export PORT=8080
else
  export PORT="${WEB_PORT}"
fi
echo "Web server will listen on PORT=${PORT}"

echo "Starting Spring Boot..."
exec java ${JAVA_OPTS} -jar /app/app.jar
