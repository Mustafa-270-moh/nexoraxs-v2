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
            ->assertJsonPath('data.shops_setup', null)
            ->assertJsonPath('data.onboarding_required', true)
            ->assertJsonPath('data.setup_required', false);
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
            ->assertJsonPath('data.shops_setup', null)
            ->assertJsonPath('data.onboarding_required', false)
            ->assertJsonPath('data.setup_required', true);

        $this->assertDatabaseHas('workspace_settings', [
            'workspace_id' => $workspaceId,
            'key' => 'shops.mode',
            'value' => 'both',
            'selected_by_user_id' => $user->id,
        ]);

        $this->getJson('/api/workspaces/owner-mode-workspace/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_mode', 'both')
            ->assertJsonPath('data.shops_setup', null)
            ->assertJsonPath('data.onboarding_required', false)
            ->assertJsonPath('data.setup_required', true);
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
            ->assertJsonPath('data.onboarding_required', false)
            ->assertJsonPath('data.setup_required', true);

        $this->getJson('/api/workspaces/shops-mode-b/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_mode', null)
            ->assertJsonPath('data.onboarding_required', true)
            ->assertJsonPath('data.setup_required', false);
    }

    public function test_shops_setup_persists_and_completed_setup_skips_wizard(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountId = $this->insertAccount('Setup Account', 'setup-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Setup Workspace', 'setup-workspace');
        $this->insertMembership($workspaceId, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/setup-workspace/apps/shops/subscribe')
            ->assertOk();

        $this->postJson('/api/workspaces/setup-workspace/shops/mode', [
            'mode' => 'online_store',
        ])->assertOk();

        $this->postJson('/api/workspaces/setup-workspace/shops/setup', [
            'business_type' => 'electronics',
            'country' => 'EG',
            'currency' => 'EGP',
            'first_branch_name' => 'Main Branch',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Shops setup saved successfully.')
            ->assertJsonPath('data.shops_mode', 'online_store')
            ->assertJsonPath('data.shops_setup.business_type', 'electronics')
            ->assertJsonPath('data.shops_setup.country', 'EG')
            ->assertJsonPath('data.shops_setup.currency', 'EGP')
            ->assertJsonPath('data.shops_setup.first_branch_name', 'Main Branch')
            ->assertJsonPath('data.setup_required', false);

        $this->assertDatabaseHas('workspace_settings', [
            'workspace_id' => $workspaceId,
            'key' => 'shops.setup',
            'selected_by_user_id' => $user->id,
        ]);

        $storedSetup = DB::table('workspace_settings')
            ->where('workspace_id', $workspaceId)
            ->where('key', 'shops.setup')
            ->value('value');

        $this->assertJsonStringEqualsJsonString(
            json_encode([
                'business_type' => 'electronics',
                'country' => 'EG',
                'currency' => 'EGP',
                'first_branch_name' => 'Main Branch',
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            (string) $storedSetup,
        );

        $this->getJson('/api/workspaces/setup-workspace/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_mode', 'online_store')
            ->assertJsonPath('data.onboarding_required', false)
            ->assertJsonPath('data.setup_required', false)
            ->assertJsonPath('data.shops_setup.business_type', 'electronics')
            ->assertJsonPath('data.shops_setup.country', 'EG')
            ->assertJsonPath('data.shops_setup.currency', 'EGP')
            ->assertJsonPath('data.shops_setup.first_branch_name', 'Main Branch');
    }

    public function test_shops_setup_is_isolated_per_workspace(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountA = $this->insertAccount('Setup Account A', 'setup-account-a');
        $accountB = $this->insertAccount('Setup Account B', 'setup-account-b');
        $workspaceA = (string) Str::ulid();
        $workspaceB = (string) Str::ulid();

        $this->insertWorkspace($workspaceA, $accountA, 'Setup Workspace A', 'setup-workspace-a');
        $this->insertWorkspace($workspaceB, $accountB, 'Setup Workspace B', 'setup-workspace-b');
        $this->insertMembership($workspaceA, $user->id, 'owner');
        $this->insertMembership($workspaceB, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/setup-workspace-a/apps/shops/subscribe')->assertOk();
        $this->postJson('/api/workspaces/setup-workspace-b/apps/shops/subscribe')->assertOk();

        $this->postJson('/api/workspaces/setup-workspace-a/shops/mode', [
            'mode' => 'business_management',
        ])->assertOk();
        $this->postJson('/api/workspaces/setup-workspace-b/shops/mode', [
            'mode' => 'both',
        ])->assertOk();

        $this->postJson('/api/workspaces/setup-workspace-a/shops/setup', [
            'business_type' => 'supermarket',
            'country' => 'EG',
            'currency' => 'EGP',
            'first_branch_name' => 'Main Branch',
        ])->assertOk();

        $this->getJson('/api/workspaces/setup-workspace-a/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_setup.business_type', 'supermarket')
            ->assertJsonPath('data.setup_required', false);

        $this->getJson('/api/workspaces/setup-workspace-b/shops/context')
            ->assertOk()
            ->assertJsonPath('data.shops_mode', 'both')
            ->assertJsonPath('data.shops_setup', null)
            ->assertJsonPath('data.setup_required', true);
    }

    public function test_invalid_business_type_is_rejected(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountId = $this->insertAccount('Invalid Setup Account', 'invalid-setup-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Invalid Setup Workspace', 'invalid-setup-workspace');
        $this->insertMembership($workspaceId, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/invalid-setup-workspace/apps/shops/subscribe')
            ->assertOk();

        $this->postJson('/api/workspaces/invalid-setup-workspace/shops/mode', [
            'mode' => 'both',
        ])->assertOk();

        $this->postJson('/api/workspaces/invalid-setup-workspace/shops/setup', [
            'business_type' => 'furniture',
            'country' => 'EG',
            'currency' => 'EGP',
            'first_branch_name' => 'Main Branch',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['business_type']);
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
