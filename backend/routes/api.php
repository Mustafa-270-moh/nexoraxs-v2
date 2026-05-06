<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\WorkspaceAppController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'app' => 'nexoraxs-api',
]));

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/workspaces', [WorkspaceController::class, 'index']);
    Route::post('/workspaces', [WorkspaceController::class, 'store']);
    Route::get('/workspaces/{slug}', [WorkspaceController::class, 'show']);
    Route::get('/workspaces/{workspaceSlug}/apps', [WorkspaceAppController::class, 'index']);
    Route::post('/workspaces/{workspaceSlug}/apps/shops/subscribe', [WorkspaceAppController::class, 'subscribeToShops']);
    Route::get('/workspaces/{workspaceSlug}/shops/context', [WorkspaceAppController::class, 'shopsContext']);
    Route::post('/workspaces/{workspaceSlug}/shops/mode', [WorkspaceAppController::class, 'storeShopsMode']);
});
