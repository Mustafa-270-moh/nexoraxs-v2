#!/bin/sh

set -eu

if [ -z "${APP_KEY:-}" ] || [ "${APP_KEY}" = "base64:REPLACE_WITH_A_REAL_APP_KEY" ]; then
    echo "APP_KEY is missing. Set a real APP_KEY in .env.production before starting the stack."
    exit 1
fi

mkdir -p \
    bootstrap/cache \
    storage/app \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

chown -R www-data:www-data storage bootstrap/cache

if [ "${RUN_COMPOSER_INSTALL:-false}" = "true" ] && [ ! -f vendor/autoload.php ]; then
    composer install --prefer-dist --no-interaction --no-progress
fi

if [ "${WAIT_FOR_DATABASE:-true}" = "true" ]; then
    echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."

    until php -r '$host = getenv("DB_HOST") ?: "postgres"; $port = (int) (getenv("DB_PORT") ?: 5432); $connection = @fsockopen($host, $port, $errorNumber, $errorText, 2); if ($connection) { fclose($connection); exit(0); } fwrite(STDERR, "Database not ready yet.\n"); exit(1);'; do
        sleep 2
    done
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force
fi

if [ "${RUN_SEEDERS:-true}" = "true" ]; then
    php artisan db:seed --force
fi

if [ "${CACHE_LARAVEL_CONFIG:-true}" = "true" ]; then
    php artisan config:cache
else
    php artisan config:clear
fi

exec "$@"
