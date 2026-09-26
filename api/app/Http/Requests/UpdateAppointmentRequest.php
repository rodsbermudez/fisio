<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'treatment_cycle_id' => 'sometimes|required|exists:treatment_cycles,id',
            'patient_plan_id' => 'nullable|exists:patient_plans,id',
            'patient_id' => 'sometimes|required|exists:patients,id',
            'room_id' => 'sometimes|required|exists:rooms,id',
            'professional_id' => 'nullable|exists:users,id',
            'appointment_date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i',
            'duration_minutes' => 'sometimes|required|in:15,30,45,60',
            'status' => 'sometimes|required|in:scheduled,completed,cancelled,missed',
            'is_evaluation' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'is_paid' => 'nullable|boolean',
            'evolution_notes' => 'nullable|string|max:5000',
        ];
    }
}
