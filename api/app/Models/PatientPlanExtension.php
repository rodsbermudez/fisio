<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientPlanExtension extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_plan_id',
        'type',
        'quantity',
        'price',
        'is_paid',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'is_paid' => 'boolean',
    ];

    public function patientPlan()
    {
        return $this->belongsTo(PatientPlan::class);
    }
}
