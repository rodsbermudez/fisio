<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TreatmentCycle extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'patient_plan_id',
        'title',
        'notes',
        'status',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function patientPlan()
    {
        return $this->belongsTo(PatientPlan::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function serviceTypes()
    {
        return $this->belongsToMany(ServiceType::class, 'service_type_treatment_cycle')->withTimestamps();
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
