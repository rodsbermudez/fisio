<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plan extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'service_type_id',
        'number_of_appointments',
        'duration_minutes',
        'billing_type',
        'price',
        'is_active',
        'has_evaluation',
        'evaluation_price',
        'evaluation_duration_minutes',
    ];

    protected $casts = [
        'number_of_appointments' => 'integer',
        'duration_minutes' => 'integer',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'has_evaluation' => 'boolean',
        'evaluation_price' => 'decimal:2',
        'evaluation_duration_minutes' => 'integer',
    ];

    public function isMonthly(): bool
    {
        return $this->billing_type === 'monthly';
    }

    public function serviceType()
    {
        return $this->belongsTo(ServiceType::class);
    }

    public function patientPlans()
    {
        return $this->hasMany(PatientPlan::class);
    }
}
