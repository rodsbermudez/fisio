<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'color' => 'nullable|string|max:7',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
        ];
    }
}
