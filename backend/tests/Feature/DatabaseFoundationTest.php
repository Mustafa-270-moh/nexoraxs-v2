<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class DatabaseFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_foundational_tables_exist_with_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('accounts'));
        $this->assertTrue(Schema::hasTable('products'));
        $this->assertTrue(Schema::hasTable('plans'));
        $this->assertTrue(Schema::hasTable('subscriptions'));
        $this->assertTrue(Schema::hasTable('workspaces'));
        $this->assertTrue(Schema::hasTable('workspace_users'));

        $this->assertTrue(Schema::hasColumns('accounts', ['id', 'name', 'slug']));
        $this->assertTrue(Schema::hasColumns('products', ['id', 'code', 'name']));
        $this->assertTrue(Schema::hasColumns('plans', ['id', 'product_id', 'code', 'name']));
        $this->assertTrue(Schema::hasColumns('subscriptions', ['account_id', 'product_id', 'plan_id', 'status']));
        $this->assertTrue(Schema::hasColumns('workspaces', ['id', 'account_id', 'name', 'slug']));
        $this->assertTrue(Schema::hasColumns('workspace_users', ['workspace_id', 'user_id', 'role']));
    }

    public function test_subscription_is_unique_per_account_and_product(): void
    {
        $this->seed();

        $now = now();
        $accountId = (string) Str::ulid();

        DB::table('accounts')->insert([
            'id' => $accountId,
            'name' => 'Acme Retail',
            'slug' => 'acme-retail',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $productId = DB::table('products')
            ->where('code', 'shops')
            ->value('id');

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
            'starts_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->expectException(QueryException::class);

        DB::table('subscriptions')->insert([
            'id' => (string) Str::ulid(),
            'account_id' => $accountId,
            'product_id' => $productId,
            'plan_id' => $planId,
            'status' => 'active',
            'starts_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function test_workspace_user_membership_is_unique_per_workspace_and_user(): void
    {
        $now = now();
        $accountId = (string) Str::ulid();
        $workspaceId = (string) Str::ulid();

        DB::table('accounts')->insert([
            'id' => $accountId,
            'name' => 'Blue Market',
            'slug' => 'blue-market',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('workspaces')->insert([
            'id' => $workspaceId,
            'account_id' => $accountId,
            'name' => 'Blue Market Main',
            'slug' => 'blue-market-main',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $userId = DB::table('users')->insertGetId([
            'name' => 'Owner User',
            'email' => 'owner@example.com',
            'password' => 'secret',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('workspace_users')->insert([
            'id' => (string) Str::ulid(),
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'role' => 'owner',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->assertDatabaseHas('workspace_users', [
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'role' => 'owner',
        ]);

        $this->expectException(QueryException::class);

        DB::table('workspace_users')->insert([
            'id' => (string) Str::ulid(),
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'role' => 'admin',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function test_seeders_create_shops_product_and_base_plans(): void
    {
        $this->seed();

        $productId = DB::table('products')
            ->where('code', 'shops')
            ->value('id');

        $this->assertNotNull($productId);

        $this->assertDatabaseHas('products', [
            'code' => 'shops',
            'name' => 'Shops',
            'is_active' => 1,
        ]);

        $planCodes = DB::table('plans')
            ->where('product_id', $productId)
            ->orderBy('code')
            ->pluck('code')
            ->all();

        $this->assertSame(['business', 'pro', 'starter'], $planCodes);
    }
}
