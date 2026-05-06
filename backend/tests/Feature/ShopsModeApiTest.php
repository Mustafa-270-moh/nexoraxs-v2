<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ShopsModeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_shops_context_requires_onboarding_until_mode_is_selected(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountId = $this->insertAccount('Mode Account', 'mode-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Mode Workspace', 'mode-workspace');
        $this->insertMembership($workspaceId, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/mode-workspace/apps/shops/subscribe')
            ->assertOk();

        $this->getJson('/api/workspaces/mode-workspace/shops/context')
            ->assertOk()
            ->assertJsonPath('data.workspace.slug', 'mode-workspace')
            ->assertJsonPath('data.subscription.status', 'active')
            ->assertJsonPath('data.shops_mode', null)
            ->assertJsonPath('data.onboarding_required', true);
    }

    public function test_owner_can_store_shops_mode_and_context_returns_it(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountId = $this->insertAccount('Owner Mode Account', 'owner-mode-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Owner Mode Workspace', 'owner-mode-workspace');
        $this->insertMembership($workspaceId, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/owner-mode-workspace/apps/shops/subscribe')
            ->assertOk();

        $this->postJson('/api/workspaces/owner-mode-workspace/shops/mode', [
            'mode' => 'both',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Shops mode saved successfully.')
            ->assertJsonPath('data.shops_mode', 'both')
            ->assertJsonPath('data.onboarding_required', false);

        $this->assertDatabaseHas('workspace_settings', [
            'workspace_id' => $workspaceId,
            'key' => 'shops.mode',
            'value' => 'both',
            'selected_by_user_id' => $user->id,
        ]);

        $this->getJson('/api/workspaces/owner-mode-workspace/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_mode', 'both')
            ->assertJsonPath('data.onboarding_required', false);
    }

    public function test_non_owner_cannot_store_shops_mode(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountId = $this->insertAccount('Member Mode Account', 'member-mode-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Member Mode Workspace', 'member-mode-workspace');
        $this->insertMembership($workspaceId, $user->id, 'member');

        $productId = DB::table('products')->where('code', 'shops')->value('id');
        $planId = DB::table('plans')
            ->where('product_id', $productId)
            ->where('code', 'starter')
            ->value('id');

        DB::table('subscriptions')->insert([
            'id' => (string) Str::ulid(),
            'account_id' => $accountId,
            'product_id' => $productId,
            'plan_id' => $planId,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user);

        $this->postJson('/api/workspaces/member-mode-workspace/shops/mode', [
            'mode' => 'online_store',
        ])
            ->assertForbidden()
            ->assertJsonPath('code', 'WORKSPACE_ROLE_FORBIDDEN');
    }

    public function test_shops_mode_is_isolated_per_workspace(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountA = $this->insertAccount('Account A', 'shops-mode-account-a');
        $accountB = $this->insertAccount('Account B', 'shops-mode-account-b');
        $workspaceA = (string) Str::ulid();
        $workspaceB = (string) Str::ulid();

        $this->insertWorkspace($workspaceA, $accountA, 'Workspace A', 'shops-mode-a');
        $this->insertWorkspace($workspaceB, $accountB, 'Workspace B', 'shops-mode-b');
        $this->insertMembership($workspaceA, $user->id, 'owner');
        $this->insertMembership($workspaceB, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/shops-mode-a/apps/shops/subscribe')
            ->assertOk();
        $this->postJson('/api/workspaces/shops-mode-b/apps/shops/subscribe')
            ->assertOk();

        $this->postJson('/api/workspaces/shops-mode-a/shops/mode', [
            'mode' => 'business_management',
        ])->assertOk();

        $this->getJson('/api/workspaces/shops-mode-a/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_mode', 'business_management')
            ->assertJsonPath('data.onboarding_required', false);

        $this->getJson('/api/workspaces/shops-mode-b/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_mode', null)
            ->assertJsonPath('data.onboarding_required', true);
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
