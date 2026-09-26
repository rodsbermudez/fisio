<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'treatment_cycle_id' => 'required|exists:treatment_cycles,id',
            'patient_plan_id' => 'nullable|exists:patient_plans,id',
            'patient_id' => 'required|exists:patients,id',
            'room_id' => 'required|exists:rooms,id',
            'professional_id' => 'nullable|exists:users,id',
            'appointment_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'duration_minutes' => 'required|in:15,30,45,60',
            'status' => 'required|in:scheduled,completed,cancelled,missed',
            'is_evaluation' => 'nullable|boolean',
            'evolution_notes' => 'nullable|string|max:5000',
        ];
    }
}
