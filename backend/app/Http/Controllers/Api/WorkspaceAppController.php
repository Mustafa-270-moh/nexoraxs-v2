<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkspaceAppController extends Controller
{
    public function index(Request $request, string $workspaceSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspaceMembership($request, $workspaceSlug);

        if (! $workspace) {
            return $this->workspaceNotFoundResponse();
        }

        $apps = DB::table('products')
            ->leftJoin('subscriptions', function ($join) use ($workspace): void {
                $join->on('subscriptions.product_id', '=', 'products.id')
                    ->where('subscriptions.account_id', '=', $workspace->account_id);
            })
            ->leftJoin('plans', 'plans.id', '=', 'subscriptions.plan_id')
            ->select(
                'products.id',
                'products.code',
                'products.name',
                'products.is_active',
                'subscriptions.id as subscription_id',
                'subscriptions.status as subscription_status',
                'subscriptions.starts_at',
                'subscriptions.ends_at',
                'plans.code as plan_code',
            )
            ->orderBy('products.name')
            ->get()
            ->map(fn (object $app): array => $this->serializeApp($app))
            ->values()
            ->all();

        return $this->successResponse(
            'Workspace apps retrieved successfully.',
            [
                'workspace' => $this->serializeWorkspace($workspace),
                'apps' => $apps,
            ],
        );
    }

    public function subscribeToShops(Request $request, string $workspaceSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspaceMembership($request, $workspaceSlug);

        if (! $workspace) {
            return $this->workspaceNotFoundResponse();
        }

        if ($workspace->role !== 'owner') {
            return $this->errorResponse(
                'Only workspace owners can subscribe to shops.',
                [],
                403,
                'WORKSPACE_ROLE_FORBIDDEN',
            );
        }

        $product = $this->resolveProductByCode('shops');
        $starterPlan = $this->resolvePlanByProductCode('shops', 'starter');

        if (! $product || ! $starterPlan) {
            return $this->errorResponse(
                'The shops product is not available.',
                [],
                404,
                'PRODUCT_NOT_AVAILABLE',
            );
        }

        $subscription = DB::transaction(function () use ($workspace, $product, $starterPlan): object {
            $existingSubscription = DB::table('subscriptions')
                ->where('account_id', $workspace->account_id)
                ->where('product_id', $product->id)
                ->first();

            $now = now();

            if ($existingSubscription) {
                DB::table('subscriptions')
                    ->where('id', $existingSubscription->id)
                    ->update([
                        'status' => 'active',
                        'starts_at' => $existingSubscription->starts_at ?? $now,
                        'ends_at' => null,
                        'updated_at' => $now,
                    ]);
            } else {
                DB::table('subscriptions')->insert([
                    'id' => (string) Str::ulid(),
                    'account_id' => $workspace->account_id,
                    'product_id' => $product->id,
                    'plan_id' => $starterPlan->id,
                    'status' => 'active',
                    'starts_at' => $now,
                    'ends_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            return $this->resolveWorkspaceProductSubscription(
                (string) $workspace->account_id,
                'shops',
            );
        });

        return $this->successResponse(
            'Shops subscription activated successfully.',
            [
                'workspace' => $this->serializeWorkspace($workspace),
                'product' => 'shops',
                'subscription' => $this->serializeSubscription($subscription),
            ],
        );
    }

    public function shopsContext(Request $request, string $workspaceSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspaceMembership($request, $workspaceSlug);

        if (! $workspace) {
            return $this->workspaceNotFoundResponse();
        }

        $subscription = $this->resolveWorkspaceProductSubscription(
            (string) $workspace->account_id,
            'shops',
        );

        return $this->successResponse(
            'Shops context retrieved successfully.',
            [
                'workspace' => $this->serializeWorkspace($workspace),
                'product' => 'shops',
                'subscription' => $this->serializeSubscription($subscription),
                'current_user_role' => (string) $workspace->role,
            ],
        );
    }

    private function resolveWorkspaceMembership(Request $request, string $workspaceSlug): ?object
    {
        /** @var User $user */
        $user = $request->user();

        return DB::table('workspaces')
            ->join('workspace_users', function ($join) use ($user): void {
                $join->on('workspace_users.workspace_id', '=', 'workspaces.id')
                    ->where('workspace_users.user_id', '=', $user->id);
            })
            ->where('workspaces.slug', $workspaceSlug)
            ->select(
                'workspaces.id',
                'workspaces.account_id',
                'workspaces.name',
                'workspaces.slug',
                'workspace_users.role',
                'workspaces.created_at',
                'workspaces.updated_at',
            )
            ->first();
    }

    private function resolveProductByCode(string $productCode): ?object
    {
        return DB::table('products')
            ->where('code', $productCode)
            ->where('is_active', true)
            ->first();
    }

    private function resolvePlanByProductCode(string $productCode, string $planCode): ?object
    {
        return DB::table('plans')
            ->join('products', 'products.id', '=', 'plans.product_id')
            ->where('products.code', $productCode)
            ->where('plans.code', $planCode)
            ->where('plans.is_active', true)
            ->select('plans.id', 'plans.product_id', 'plans.code', 'plans.name')
            ->first();
    }

    private function resolveWorkspaceProductSubscription(string $accountId, string $productCode): ?object
    {
        return DB::table('subscriptions')
            ->join('products', 'products.id', '=', 'subscriptions.product_id')
            ->leftJoin('plans', 'plans.id', '=', 'subscriptions.plan_id')
            ->where('subscriptions.account_id', $accountId)
            ->where('products.code', $productCode)
            ->select(
                'subscriptions.id',
                'subscriptions.status',
                'subscriptions.starts_at',
                'subscriptions.ends_at',
                'plans.code as plan_code',
            )
            ->first();
    }

    /**
     * @return array<string, bool|string|null>
     */
    private function serializeApp(object $app): array
    {
        $subscriptionStatus = $app->subscription_status
            ? (string) $app->subscription_status
            : 'not_subscribed';

        return [
            'code' => (string) $app->code,
            'name' => (string) $app->name,
            'is_active' => (bool) $app->is_active,
            'subscription_status' => $subscriptionStatus,
            'plan_code' => $app->plan_code ? (string) $app->plan_code : null,
            'has_access' => $subscriptionStatus === 'active',
        ];
    }

    /**
     * @return array<string, int|string|null>
     */
    private function serializeWorkspace(object $workspace): array
    {
        return [
            'id' => (string) $workspace->id,
            'account_id' => (string) $workspace->account_id,
            'name' => (string) $workspace->name,
            'slug' => (string) $workspace->slug,
            'role' => isset($workspace->role) ? (string) $workspace->role : null,
            'created_at' => $workspace->created_at ? (string) $workspace->created_at : null,
            'updated_at' => $workspace->updated_at ? (string) $workspace->updated_at : null,
        ];
    }

    /**
     * @return array<string, bool|string|null>
     */
    private function serializeSubscription(?object $subscription): array
    {
        if (! $subscription) {
            return [
                'status' => 'not_subscribed',
                'plan_code' => null,
                'starts_at' => null,
                'ends_at' => null,
                'has_access' => false,
            ];
        }

        return [
            'status' => (string) $subscription->status,
            'plan_code' => $subscription->plan_code ? (string) $subscription->plan_code : null,
            'starts_at' => $subscription->starts_at ? (string) $subscription->starts_at : null,
            'ends_at' => $subscription->ends_at ? (string) $subscription->ends_at : null,
            'has_access' => $subscription->status === 'active',
        ];
    }

    private function workspaceNotFoundResponse(): JsonResponse
    {
        return $this->errorResponse(
            'Workspace not found.',
            [],
            404,
            'WORKSPACE_NOT_FOUND',
        );
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
