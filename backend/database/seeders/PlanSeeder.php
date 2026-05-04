<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlanSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $productId = DB::table('products')
            ->where('code', 'shops')
            ->value('id');

        if ($productId === null) {
            throw new \RuntimeException('The shops product must be seeded before plans.');
        }

        $now = now();

        foreach ([
            ['code' => 'starter', 'name' => 'Starter'],
            ['code' => 'pro', 'name' => 'Pro'],
            ['code' => 'business', 'name' => 'Business'],
        ] as $plan) {
            $existingPlan = DB::table('plans')
                ->where('product_id', $productId)
                ->where('code', $plan['code'])
                ->first();

            if ($existingPlan !== null) {
                DB::table('plans')
                    ->where('id', $existingPlan->id)
                    ->update([
                        'name' => $plan['name'],
                        'is_active' => true,
                        'updated_at' => $now,
                    ]);

                continue;
            }

            DB::table('plans')->insert([
                'id' => (string) Str::ulid(),
                'product_id' => $productId,
                'code' => $plan['code'],
                'name' => $plan['name'],
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
