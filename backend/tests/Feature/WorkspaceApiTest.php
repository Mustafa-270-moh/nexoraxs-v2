<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class WorkspaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_access_workspace_endpoints(): void
    {
        $workspaceId = (string) Str::ulid();
        $accountId = $this->insertAccount('External Account', 'external-account');
        $this->insertWorkspace($workspaceId, $accountId, 'External Workspace', 'external-workspace');

        $this->getJson('/api/workspaces')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');

        $this->postJson('/api/workspaces', [
            'name' => 'Alpha Workspace',
            'slug' => 'alpha-workspace',
        ])->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');

        $this->getJson('/api/workspaces/external-workspace')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    public function test_authenticated_user_can_create_workspace_and_bootstrap_account(): void
    {
        $user = User::factory()->create([
            'name' => 'Nexora Owner',
            'email' => 'owner@example.com',
        ]);

        $this->actingAs($user);

        $response = $this->postJson('/api/workspaces', [
            'name' => 'Blue Market',
            'slug' => 'blue-market',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Workspace created successfully.')
            ->assertJsonPath('data.workspace.name', 'Blue Market')
            ->assertJsonPath('data.workspace.slug', 'blue-market')
            ->assertJsonPath('data.workspace.role', 'owner');

        $workspaceId = $response->json('data.workspace.id');
        $accountId = $response->json('data.workspace.account_id');

        $this->assertNotNull($workspaceId);
        $this->assertNotNull($accountId);

        $this->assertDatabaseHas('accounts', [
            'id' => $accountId,
        ]);

        $this->assertDatabaseHas('workspaces', [
            'id' => $workspaceId,
            'account_id' => $accountId,
            'name' => 'Blue Market',
            'slug' => 'blue-market',
        ]);
    }

    public function test_workspace_creator_becomes_owner_member(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $response = $this->postJson('/api/workspaces', [
            'name' => 'Owner Workspace',
            'slug' => 'owner-workspace',
        ])->assertCreated();

        $workspaceId = $response->json('data.workspace.id');

        $this->assertDatabaseHas('workspace_users', [
            'workspace_id' => $workspaceId,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
    }

    public function test_user_can_list_only_workspaces_they_belong_to(): void
    {
        $user = User::factory()->create([
            'email' => 'member@example.com',
        ]);
        $otherUser = User::factory()->create([
            'email' => 'other@example.com',
        ]);

        $accountA = $this->insertAccount('Alpha Account', 'alpha-account');
        $accountB = $this->insertAccount('Beta Account', 'beta-account');

        $workspaceA = (string) Str::ulid();
        $workspaceB = (string) Str::ulid();
        $workspaceC = (string) Str::ulid();

        $this->insertWorkspace($workspaceA, $accountA, 'Alpha Workspace', 'alpha-workspace');
        $this->insertWorkspace($workspaceB, $accountA, 'Beta Workspace', 'beta-workspace');
        $this->insertWorkspace($workspaceC, $accountB, 'Gamma Workspace', 'gamma-workspace');

        $this->insertMembership($workspaceA, $user->id, 'owner');
        $this->insertMembership($workspaceB, $user->id, 'member');
        $this->insertMembership($workspaceC, $otherUser->id, 'owner');

        $this->actingAs($user);

        $response = $this->getJson('/api/workspaces')
            ->assertOk()
            ->assertJsonPath('meta.count', 2);

        $slugs = collect($response->json('data'))
            ->pluck('slug')
            ->sort()
            ->values()
            ->all();

        $this->assertSame(['alpha-workspace', 'beta-workspace'], $slugs);
    }

    public function test_user_can_fetch_workspace_they_belong_to(): void
    {
        $user = User::factory()->create();
        $accountId = $this->insertAccount('Fetch Account', 'fetch-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Fetch Workspace', 'fetch-workspace');
        $this->insertMembership($workspaceId, $user->id, 'viewer');

        $this->actingAs($user);

        $this->getJson('/api/workspaces/fetch-workspace')
            ->assertOk()
            ->assertJsonPath('message', 'Workspace retrieved successfully.')
            ->assertJsonPath('data.workspace.id', $workspaceId)
            ->assertJsonPath('data.workspace.slug', 'fetch-workspace')
            ->assertJsonPath('data.workspace.role', 'viewer');
    }

    public function test_user_cannot_fetch_workspace_they_do_not_belong_to(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $accountId = $this->insertAccount('Hidden Account', 'hidden-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Hidden Workspace', 'hidden-workspace');
        $this->insertMembership($workspaceId, $otherUser->id, 'owner');

        $this->actingAs($user);

        $this->getJson('/api/workspaces/hidden-workspace')
            ->assertNotFound()
            ->assertJsonPath('message', 'Workspace not found.')
            ->assertJsonPath('code', 'WORKSPACE_NOT_FOUND');
    }

    private function insertAccount(string $name, string $slug): string
    {
        $accountId = (string) Str::ulid();

        DB::table('accounts')->insert([
            'id' => $accountId,
            'name' => $name,
            'slug' => $slug,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $accountId;
    }

    private function insertWorkspace(string $workspaceId, string $accountId, string $name, string $slug): void
    {
        DB::table('workspaces')->insert([
            'id' => $workspaceId,
            'account_id' => $accountId,
            'name' => $name,
            'slug' => $slug,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertMembership(string $workspaceId, int $userId, string $role): void
    {
        DB::table('workspace_users')->insert([
            'id' => (string) Str::ulid(),
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'role' => $role,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
