<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'treatment_cycle_id',
        'patient_plan_id',
        'patient_id',
        'room_id',
        'professional_id',
        'appointment_date',
        'start_time',
        'duration_minutes',
        'price',
        'is_paid',
        'status',
        'is_evaluation',
        'evolution_notes',
        'completed_at',
        'created_by',
    ];

    protected $casts = [
        'appointment_date' => 'date:Y-m-d',
        'duration_minutes' => 'integer',
        'price' => 'decimal:2',
        'is_paid' => 'boolean',
        'is_evaluation' => 'boolean',
    ];

    public function treatmentCycle()
    {
        return $this->belongsTo(TreatmentCycle::class);
    }

    public function patientPlan()
    {
        return $this->belongsTo(PatientPlan::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function professional()
    {
        return $this->belongsTo(User::class, 'professional_id');
    }
}
