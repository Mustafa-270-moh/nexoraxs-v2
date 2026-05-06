<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShopsModeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'mode' => [
                'required',
                'string',
                Rule::in(['business_management', 'online_store', 'both']),
            ],
        ];
    }
}
