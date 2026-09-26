<?php

// Lê as origens permitidas da variável de ambiente FRONTEND_URLS
// Separe múltiplas URLs por vírgula
// Exemplo: FRONTEND_URLS=http://localhost:5173,http://localhost/fisio/app,https://app.seudominio.com
$frontendUrls = env('FRONTEND_URLS', 'http://localhost/fisio/app,http://localhost:5173');

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_map('trim', explode(',', $frontendUrls)),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
