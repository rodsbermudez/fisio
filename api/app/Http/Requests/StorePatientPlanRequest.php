<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientPlanRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('evaluation_time') && $this->filled('evaluation_time')) {
            $this->merge([
                'evaluation_time' => substr($this->input('evaluation_time'), 0, 5),
            ]);
        }

        if ($this->has('schedule_rules') && is_array($this->input('schedule_rules'))) {
            $this->merge([
                'schedule_rules' => array_map(
                    fn ($time) => is_string($time) ? substr($time, 0, 5) : $time,
                    $this->input('schedule_rules')
                ),
            ]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'plan_id' => 'nullable|exists:plans,id',
            'service_type_id' => 'required|exists:service_types,id',
            'room_id' => 'required|exists:rooms,id',
            'professional_id' => 'nullable|exists:users,id',
            'name' => 'required|string|max:255',
            'number_of_appointments' => 'nullable|required_if:billing_type,appointments|integer|min:1',
            'duration_minutes' => 'required|in:15,30,45,60',
            'billing_type' => 'nullable|in:appointments,monthly',
            'price' => 'nullable|numeric|min:0',
            'is_paid' => 'nullable|boolean',
            'start_date' => 'required|date',
            'has_evaluation' => 'nullable|boolean',
            'evaluation_price' => 'nullable|required_if:has_evaluation,true|numeric|min:0',
            'evaluation_duration_minutes' => 'nullable|required_if:has_evaluation,true|in:15,30,45,60',
            'evaluation_date' => 'nullable|required_if:has_evaluation,true|date',
            'evaluation_time' => 'nullable|required_if:has_evaluation,true|date_format:H:i',
            'evaluation_room_id' => 'nullable|required_if:has_evaluation,true|exists:rooms,id',
            'schedule_rules' => 'required|array',
            'schedule_rules.*' => 'nullable|date_format:H:i',
        ];
    }
}
