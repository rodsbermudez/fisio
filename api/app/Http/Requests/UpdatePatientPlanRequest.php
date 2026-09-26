<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientPlanRequest extends FormRequest
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
            'service_type_id' => 'sometimes|required|exists:service_types,id',
            'room_id' => 'sometimes|required|exists:rooms,id',
            'professional_id' => 'nullable|exists:users,id',
            'name' => 'sometimes|required|string|max:255',
            'number_of_appointments' => 'nullable|required_if:billing_type,appointments|integer|min:1',
            'duration_minutes' => 'sometimes|required|in:15,30,45,60',
            'billing_type' => 'nullable|in:appointments,monthly',
            'price' => 'nullable|numeric|min:0',
            'is_paid' => 'nullable|boolean',
            'start_date' => 'sometimes|required|date',
            'has_evaluation' => 'nullable|boolean',
            'evaluation_price' => 'nullable|numeric|min:0',
            'evaluation_duration_minutes' => 'nullable|in:15,30,45,60',
            'evaluation_date' => 'nullable|date',
            'evaluation_time' => 'nullable|date_format:H:i',
            'evaluation_room_id' => 'nullable|exists:rooms,id',
            'schedule_rules' => 'sometimes|required|array',
            'schedule_rules.*' => 'nullable|date_format:H:i',
            'status' => 'nullable|in:active,finished,cancelled',
            'reschedule_future_appointments' => 'nullable|boolean',
        ];
    }
}
