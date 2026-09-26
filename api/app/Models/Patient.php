<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'name',
        'cpf',
        'birth_date',
        'profession',
        'phone',
        'email',
        'street',
        'number',
        'neighborhood',
        'complement',
        'zip_code',
        'city',
        'state',
        'emergency_contact_name',
        'emergency_contact_phone',
        'is_active',
    ];

    protected $casts = [
        'birth_date' => 'date:Y-m-d',
        'is_active' => 'boolean',
    ];

    protected $appends = ['pending_amount', 'total_remaining_appointments'];

    public function treatmentCycles()
    {
        return $this->hasMany(TreatmentCycle::class);
    }

    public function patientPlans()
    {
        return $this->hasMany(PatientPlan::class);
    }

    public function getPendingAmountAttribute(): float
    {
        return $this->patientPlans->sum(function ($plan) {
            $pending = $plan->extensions->where('is_paid', false)->sum('price');
            $pending += $plan->appointments->where('is_evaluation', true)->where('is_paid', false)->sum('price');
            return $pending;
        });
    }

    public function getTotalRemainingAppointmentsAttribute(): int
    {
        return $this->patientPlans
            ->where('status', 'active')
            ->sum('remaining_appointments');
    }
}
