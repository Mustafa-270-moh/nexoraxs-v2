FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --no-scripts

COPY . .

RUN composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction \
    --no-progress

FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
        icu-dev \
        libzip-dev \
        oniguruma-dev \
        postgresql-dev \
        sqlite-dev \
    && docker-php-ext-install \
        bcmath \
        intl \
        mbstring \
        opcache \
        pdo_pgsql \
        pdo_sqlite \
        pgsql \
        sqlite3 \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis opcache \
    && rm -rf /tmp/pear

WORKDIR /var/www/html

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=vendor /app /var/www/html
COPY docker/entrypoint.sh /usr/local/bin/nexoraxs-entrypoint

RUN chmod +x /usr/local/bin/nexoraxs-entrypoint \
    && mkdir -p \
        bootstrap/cache \
        storage/app \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
    && chown -R www-data:www-data /var/www/html

ENTRYPOINT ["nexoraxs-entrypoint"]
CMD ["php-fpm", "-F"]
