<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | These settings allow the first-party frontend apps to call the Laravel
    | API with credentials so Sanctum session and CSRF cookies can be used
    | across the nexoraxs.com subdomains.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(
            ',',
            env(
                'CORS_ALLOWED_ORIGINS',
                'https://app.nexoraxs.com,https://shops.nexoraxs.com,https://admin.nexoraxs.com'
            )
        )
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
