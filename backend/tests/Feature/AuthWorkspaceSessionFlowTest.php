<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthWorkspaceSessionFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_registered_session_can_fetch_me_create_workspace_and_list_it(): void
    {
        $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/auth/register', [
                'name' => 'Flow User',
                'email' => 'flow@example.com',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
            ])
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'flow@example.com');

        $this->withHeaders($this->statefulHeaders())
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'flow@example.com');

        $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/workspaces', [
                'name' => 'Flow Workspace',
                'slug' => 'flow-workspace',
            ])
            ->assertCreated()
            ->assertJsonPath('data.workspace.slug', 'flow-workspace')
            ->assertJsonPath('data.workspace.role', 'owner');

        $this->withHeaders($this->statefulHeaders())
            ->getJson('/api/workspaces')
            ->assertOk()
            ->assertJsonPath('meta.count', 1)
            ->assertJsonPath('data.0.slug', 'flow-workspace')
            ->assertJsonPath('data.0.role', 'owner');
    }

    public function test_logged_out_session_loses_access_to_me_and_workspaces(): void
    {
        User::factory()->create([
            'email' => 'session@example.com',
            'password' => 'secret123',
        ]);

        $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/auth/login', [
                'email' => 'session@example.com',
                'password' => 'secret123',
            ])
            ->assertOk();

        $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('data.logged_out', true);

        app('auth')->forgetGuards();

        $this->withHeaders($this->statefulHeaders())
            ->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');

        $this->withHeaders($this->statefulHeaders())
            ->getJson('/api/workspaces')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');
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
