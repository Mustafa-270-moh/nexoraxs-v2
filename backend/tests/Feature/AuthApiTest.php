<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_via_auth_api(): void
    {
        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/auth/register', [
                'name' => 'Nexora User',
                'email' => 'user@example.com',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Registration completed successfully.')
            ->assertJsonPath('data.user.name', 'Nexora User')
            ->assertJsonPath('data.user.email', 'user@example.com');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'user@example.com',
            'name' => 'Nexora User',
        ]);
    }

    public function test_user_can_login_and_receive_authenticated_user_payload(): void
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'secret123',
        ]);

        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/auth/login', [
                'email' => 'user@example.com',
                'password' => 'secret123',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login completed successfully.')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', 'user@example.com');

        $this->assertAuthenticatedAs($user);
    }

    public function test_authenticated_user_can_fetch_me_payload(): void
    {
        $user = User::factory()->create([
            'email' => 'me@example.com',
            'password' => 'secret123',
        ]);

        $this->actingAs($user);

        $this->withHeaders($this->statefulHeaders())
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('message', 'Authenticated user retrieved successfully.')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', 'me@example.com');
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.com',
            'password' => 'secret123',
        ]);

        $this->actingAs($user);

        $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logout completed successfully.')
            ->assertJsonPath('data.logged_out', true);

        app('auth')->forgetGuards();

        $this->assertGuest();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'secret123',
        ]);

        $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/auth/login', [
                'email' => 'user@example.com',
                'password' => 'wrong-password',
            ])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'The provided credentials are incorrect.')
            ->assertJsonPath('code', 'INVALID_CREDENTIALS')
            ->assertJsonPath('errors.email.0', 'The provided credentials are incorrect.');

        $this->assertGuest();
    }

    /**
     * @return array<string, string>
     */
    private function statefulHeaders(): array
    {
        return [
            'Origin' => 'https://app.nexoraxs.com',
            'Referer' => 'https://app.nexoraxs.com/',
            'Accept' => 'application/json',
        ];
    }
}
