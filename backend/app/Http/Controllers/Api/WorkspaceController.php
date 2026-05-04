<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $workspaces = DB::table('workspaces')
            ->join('workspace_users', 'workspace_users.workspace_id', '=', 'workspaces.id')
            ->where('workspace_users.user_id', $user->id)
            ->select(
                'workspaces.id',
                'workspaces.account_id',
                'workspaces.name',
                'workspaces.slug',
                'workspace_users.role',
                'workspaces.created_at',
                'workspaces.updated_at',
            )
            ->orderBy('workspaces.name')
            ->get()
            ->map(fn (object $workspace): array => $this->serializeWorkspace($workspace))
            ->values()
            ->all();

        return response()->json([
            'data' => $workspaces,
            'meta' => [
                'count' => count($workspaces),
            ],
        ]);
    }

    public function store(StoreWorkspaceRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $workspace = DB::transaction(function () use ($user, $validated): object {
            $accountId = DB::table('workspaces')
                ->join('workspace_users', 'workspace_users.workspace_id', '=', 'workspaces.id')
                ->where('workspace_users.user_id', $user->id)
                ->where('workspace_users.role', 'owner')
                ->orderBy('workspaces.created_at')
                ->value('workspaces.account_id');

            if (! $accountId) {
                $accountId = $this->createAccountForUser($user);
            }

            $workspaceId = (string) Str::ulid();
            $now = now();

            DB::table('workspaces')->insert([
                'id' => $workspaceId,
                'account_id' => $accountId,
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('workspace_users')->insert([
                'id' => (string) Str::ulid(),
                'workspace_id' => $workspaceId,
                'user_id' => $user->id,
                'role' => 'owner',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return DB::table('workspaces')
                ->join('workspace_users', function ($join) use ($user): void {
                    $join->on('workspace_users.workspace_id', '=', 'workspaces.id')
                        ->where('workspace_users.user_id', '=', $user->id);
                })
                ->where('workspaces.id', $workspaceId)
                ->select(
                    'workspaces.id',
                    'workspaces.account_id',
                    'workspaces.name',
                    'workspaces.slug',
                    'workspace_users.role',
                    'workspaces.created_at',
                    'workspaces.updated_at',
                )
                ->firstOrFail();
        });

        return $this->successResponse(
            'Workspace created successfully.',
            ['workspace' => $this->serializeWorkspace($workspace)],
            201,
        );
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $workspace = DB::table('workspaces')
            ->join('workspace_users', function ($join) use ($user): void {
                $join->on('workspace_users.workspace_id', '=', 'workspaces.id')
                    ->where('workspace_users.user_id', '=', $user->id);
            })
            ->where('workspaces.slug', $slug)
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

        if (! $workspace) {
            return $this->errorResponse(
                'Workspace not found.',
                [],
                404,
                'WORKSPACE_NOT_FOUND',
            );
        }

        return $this->successResponse(
            'Workspace retrieved successfully.',
            ['workspace' => $this->serializeWorkspace($workspace)],
        );
    }

    private function createAccountForUser(User $user): string
    {
        $accountId = (string) Str::ulid();
        $baseName = trim($user->name) !== ''
            ? trim($user->name)
            : Str::before((string) $user->email, '@');
        $baseSlug = Str::slug($baseName);

        if ($baseSlug === '') {
            $baseSlug = 'account';
        }

        DB::table('accounts')->insert([
            'id' => $accountId,
            'name' => $baseName.' Account',
            'slug' => $this->uniqueSlug('accounts', 'slug', $baseSlug),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $accountId;
    }

    private function uniqueSlug(string $table, string $column, string $base): string
    {
        $slug = $base;
        $suffix = 2;

        while (DB::table($table)->where($column, $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
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
