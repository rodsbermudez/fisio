<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'document',
        'email',
        'phone',
        'address',
        'primary_color',
        'is_active',
        'subscription_ends_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'subscription_ends_at' => 'datetime',
    ];

    /**
     * Users belonging to this tenant.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Patients belonging to this tenant.
     */
    public function patients()
    {
        return $this->hasMany(Patient::class);
    }

    /**
     * Appointments belonging to this tenant.
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Patient plans belonging to this tenant.
     */
    public function patientPlans()
    {
        return $this->hasMany(PatientPlan::class);
    }
}
