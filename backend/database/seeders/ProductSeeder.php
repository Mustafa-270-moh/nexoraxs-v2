<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = now();

        $product = DB::table('products')
            ->where('code', 'shops')
            ->first();

        if ($product !== null) {
            DB::table('products')
                ->where('id', $product->id)
                ->update([
                    'name' => 'Shops',
                    'is_active' => true,
                    'updated_at' => $now,
                ]);

            return;
        }

        DB::table('products')->insert([
            'id' => (string) Str::ulid(),
            'code' => 'shops',
            'name' => 'Shops',
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}
