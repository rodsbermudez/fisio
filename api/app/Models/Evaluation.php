<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Evaluation extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'treatment_cycle_id',
        'template_version_id',
        'responses',
        'finalized_at',
    ];

    protected $casts = [
        'responses' => 'array',
        'finalized_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function treatmentCycle()
    {
        return $this->belongsTo(TreatmentCycle::class);
    }

    public function templateVersion()
    {
        return $this->belongsTo(TemplateVersion::class);
    }
}
