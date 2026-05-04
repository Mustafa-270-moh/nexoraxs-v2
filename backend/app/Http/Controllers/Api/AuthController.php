<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
        ]);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return $this->successResponse(
            'Registration completed successfully.',
            ['user' => $this->serializeUser($user)],
            201,
        );
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = [
            'email' => strtolower($request->validated('email')),
            'password' => $request->validated('password'),
        ];

        if (! Auth::guard('web')->attempt($credentials)) {
            return $this->errorResponse(
                'The provided credentials are incorrect.',
                ['email' => ['The provided credentials are incorrect.']],
                401,
                'INVALID_CREDENTIALS',
            );
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = $request->user();

        return $this->successResponse(
            'Login completed successfully.',
            ['user' => $this->serializeUser($user)],
        );
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->successResponse(
            'Logout completed successfully.',
            ['logged_out' => true],
        );
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->successResponse(
            'Authenticated user retrieved successfully.',
            ['user' => $this->serializeUser($user)],
        );
    }

    /**
     * @return array<string, int|string|null>
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toJSON(),
            'created_at' => $user->created_at?->toJSON(),
            'updated_at' => $user->updated_at?->toJSON(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function successResponse(string $message, array $data, int $status = 200): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * @param  array<string, array<int, string>>  $errors
     */
    private function errorResponse(string $message, array $errors, int $status, string $code): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => $errors,
            'code' => $code,
        ], $status);
    }
}
