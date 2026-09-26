<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientPlan extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'plan_id',
        'service_type_id',
        'room_id',
        'professional_id',
        'name',
        'number_of_appointments',
        'duration_minutes',
        'billing_type',
        'price',
        'is_paid',
        'remaining_appointments',
        'schedule_rules',
        'status',
        'start_date',
        'has_evaluation',
        'evaluation_price',
        'evaluation_duration_minutes',
        'evaluation_date',
        'evaluation_time',
        'evaluation_room_id',
    ];

    protected $casts = [
        'number_of_appointments' => 'integer',
        'duration_minutes' => 'integer',
        'price' => 'decimal:2',
        'is_paid' => 'boolean',
        'remaining_appointments' => 'integer',
        'schedule_rules' => 'array',
        'start_date' => 'date',
        'has_evaluation' => 'boolean',
        'evaluation_price' => 'decimal:2',
        'evaluation_duration_minutes' => 'integer',
        'evaluation_date' => 'date',
    ];

    protected $appends = ['given_appointments_count', 'schedulable_appointments'];

    public function getGivenAppointmentsCountAttribute(): int
    {
        if ($this->relationLoaded('appointments')) {
            return $this->appointments->filter(fn ($appointment) => in_array($appointment->status, ['completed', 'missed']) && ! $appointment->is_evaluation)->count();
        }

        return $this->appointments()
            ->whereIn('status', ['completed', 'missed'])
            ->where('is_evaluation', false)
            ->count();
    }

    /**
     * Créditos de aulas ainda não vinculados a um atendimento agendado.
     * Disponível apenas para planos por quantidade.
     */
    public function getSchedulableAppointmentsAttribute(): int
    {
        if ($this->billing_type !== 'appointments') {
            return 0;
        }

        if ($this->relationLoaded('appointments')) {
            $scheduled = $this->appointments
                ->filter(fn ($appointment) => ! $appointment->is_evaluation && $appointment->status === 'scheduled')
                ->count();
        } else {
            $scheduled = $this->appointments()
                ->where('is_evaluation', false)
                ->where('status', 'scheduled')
                ->count();
        }

        return max(0, (int) ($this->remaining_appointments ?? 0) - $scheduled);
    }

    public function isMonthly(): bool
    {
        return $this->billing_type === 'monthly';
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function serviceType()
    {
        return $this->belongsTo(ServiceType::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function evaluationRoom()
    {
        return $this->belongsTo(Room::class, 'evaluation_room_id');
    }

    public function professional()
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function extensions()
    {
        return $this->hasMany(PatientPlanExtension::class)->orderBy('created_at');
    }
}
