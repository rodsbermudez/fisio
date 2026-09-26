<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'service_type_id' => 'required|exists:service_types,id',
            'number_of_appointments' => 'nullable|required_if:billing_type,appointments|integer|min:1',
            'duration_minutes' => 'required|in:15,30,45,60',
            'billing_type' => 'nullable|in:appointments,monthly',
            'price' => 'nullable|numeric|min:0',
            'has_evaluation' => 'nullable|boolean',
            'evaluation_price' => 'nullable|required_if:has_evaluation,true|numeric|min:0',
            'evaluation_duration_minutes' => 'nullable|required_if:has_evaluation,true|in:15,30,45,60',
            'is_active' => 'nullable|boolean',
        ];
    }
}
