<?php

namespace App\Http\Requests;

use App\Rules\Cpf;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation (sanitiza CPF, CEP e telefone).
     */
    protected function prepareForValidation(): void
    {
        foreach (['cpf', 'zip_code', 'phone', 'emergency_contact_phone'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $this->merge([
                    $field => preg_replace('/\D/', '', $this->input($field)),
                ]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $patientId = $this->route('patient')->id;

        return [
            'name' => 'sometimes|required|string|max:255',
            'cpf' => [
                'sometimes',
                'required',
                'string',
                'max:11',
                Rule::unique('patients', 'cpf')->ignore($patientId),
                new Cpf,
            ],
            'birth_date' => 'nullable|date',
            'profession' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:11',
            'email' => 'nullable|email|max:255',
            'street' => 'nullable|string|max:255',
            'number' => 'nullable|string|max:20',
            'neighborhood' => 'nullable|string|max:255',
            'complement' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:8',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|size:2',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:11',
            'is_active' => 'nullable|boolean',
        ];
    }
}
