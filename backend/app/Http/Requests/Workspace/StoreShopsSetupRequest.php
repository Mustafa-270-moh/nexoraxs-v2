<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShopsSetupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'business_type' => is_string($this->business_type) ? trim($this->business_type) : $this->business_type,
            'country' => is_string($this->country) ? trim($this->country) : $this->country,
            'currency' => is_string($this->currency) ? trim($this->currency) : $this->currency,
            'first_branch_name' => is_string($this->first_branch_name)
                ? trim($this->first_branch_name)
                : $this->first_branch_name,
        ]);

        if ($this->input('first_branch_name') === '') {
            $this->merge([
                'first_branch_name' => null,
            ]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'business_type' => [
                'required',
                'string',
                Rule::in([
                    'mobile_store',
                    'clothing',
                    'shoes',
                    'supermarket',
                    'electronics',
                    'other',
                ]),
            ],
            'country' => [
                'required',
                'string',
                Rule::in(['EG']),
            ],
            'currency' => [
                'required',
                'string',
                Rule::in(['EGP']),
            ],
            'first_branch_name' => [
                'nullable',
                'string',
                'max:120',
            ],
        ];
    }
}
