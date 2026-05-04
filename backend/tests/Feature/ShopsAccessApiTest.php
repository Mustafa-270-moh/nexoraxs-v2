<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ShopsAccessApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_access_shops_access_endpoints(): void
    {
        $accountId = $this->insertAccount('Guest Account', 'guest-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Guest Workspace', 'guest-workspace');

        $this->getJson('/api/workspaces/guest-workspace/apps')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');

        $this->postJson('/api/workspaces/guest-workspace/apps/shops/subscribe')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');

        $this->getJson('/api/workspaces/guest-workspace/shops/context')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    public function test_non_member_cannot_access_workspace_apps_or_shops_context(): void
    {
        $user = User::factory()->create();
        $accountId = $this->insertAccount('Hidden Account', 'hidden-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Hidden Workspace', 'hidden-workspace');

        $this->actingAs($user);

        $this->getJson('/api/workspaces/hidden-workspace/apps')
            ->assertNotFound()
            ->assertJsonPath('code', 'WORKSPACE_NOT_FOUND');

        $this->getJson('/api/workspaces/hidden-workspace/shops/context')
            ->assertNotFound()
            ->assertJsonPath('code', 'WORKSPACE_NOT_FOUND');
    }

    public function test_owner_can_subscribe_to_shops(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountId = $this->insertAccount('Blue Account', 'blue-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Blue Workspace', 'blue-workspace');
        $this->insertMembership($workspaceId, $user->id, 'owner');

        $this->actingAs($user);

        $response = $this->postJson('/api/workspaces/blue-workspace/apps/shops/subscribe');

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Shops subscription activated successfully.')
            ->assertJsonPath('data.product', 'shops')
            ->assertJsonPath('data.subscription.status', 'active')
            ->assertJsonPath('data.subscription.plan_code', 'starter')
            ->assertJsonPath('data.subscription.has_access', true);

        $productId = DB::table('products')->where('code', 'shops')->value('id');
        $planId = DB::table('plans')
            ->where('product_id', $productId)
            ->where('code', 'starter')
            ->value('id');

        $this->assertDatabaseHas('subscriptions', [
            'account_id' => $accountId,
            'product_id' => $productId,
            'plan_id' => $planId,
            'status' => 'active',
        ]);
    }

    public function test_subscribed_workspace_returns_active_shops_access_in_apps_and_context(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountId = $this->insertAccount('Alpha Account', 'alpha-account');
        $workspaceId = (string) Str::ulid();

        $this->insertWorkspace($workspaceId, $accountId, 'Alpha Workspace', 'alpha-workspace');
        $this->insertMembership($workspaceId, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/alpha-workspace/apps/shops/subscribe')
            ->assertOk();

        $this->getJson('/api/workspaces/alpha-workspace/apps')
            ->assertOk()
            ->assertJsonPath('data.workspace.slug', 'alpha-workspace')
            ->assertJsonPath('data.apps.0.code', 'shops')
            ->assertJsonPath('data.apps.0.subscription_status', 'active')
            ->assertJsonPath('data.apps.0.plan_code', 'starter')
            ->assertJsonPath('data.apps.0.has_access', true);

        $this->getJson('/api/workspaces/alpha-workspace/shops/context')
            ->assertOk()
            ->assertJsonPath('message', 'Shops context retrieved successfully.')
            ->assertJsonPath('data.workspace.slug', 'alpha-workspace')
            ->assertJsonPath('data.product', 'shops')
            ->assertJsonPath('data.subscription.status', 'active')
            ->assertJsonPath('data.subscription.plan_code', 'starter')
            ->assertJsonPath('data.subscription.has_access', true)
            ->assertJsonPath('data.current_user_role', 'owner');
    }

    public function test_another_workspace_does_not_see_shops_access_from_a_different_account(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $accountA = $this->insertAccount('Account A', 'account-a');
        $accountB = $this->insertAccount('Account B', 'account-b');
        $workspaceA = (string) Str::ulid();
        $workspaceB = (string) Str::ulid();

        $this->insertWorkspace($workspaceA, $accountA, 'Workspace A', 'workspace-a');
        $this->insertWorkspace($workspaceB, $accountB, 'Workspace B', 'workspace-b');
        $this->insertMembership($workspaceA, $user->id, 'owner');
        $this->insertMembership($workspaceB, $user->id, 'owner');

        $this->actingAs($user);

        $this->postJson('/api/workspaces/workspace-a/apps/shops/subscribe')
            ->assertOk();

        $this->getJson('/api/workspaces/workspace-b/shops/context')
            ->assertOk()
            ->assertJsonPath('data.workspace.slug', 'workspace-b')
            ->assertJsonPath('data.product', 'shops')
            ->assertJsonPath('data.subscription.status', 'not_subscribed')
            ->assertJsonPath('data.subscription.has_access', false)
            ->assertJsonPath('data.current_user_role', 'owner');
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
