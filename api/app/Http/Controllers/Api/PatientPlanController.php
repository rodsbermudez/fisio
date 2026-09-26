<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExtendPatientPlanRequest;
use App\Http\Requests\StorePatientPlanRequest;
use App\Http\Requests\UpdatePatientPlanRequest;
use App\Models\Appointment;
use App\Models\PatientPlan;
use App\Models\PatientPlanExtension;
use App\Models\TreatmentCycle;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientPlanController extends Controller
{
    public function index(Request $request)
    {
        $query = PatientPlan::with(['patient', 'serviceType', 'room', 'plan', 'professional', 'evaluationRoom', 'extensions', 'appointments']);

        if ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(StorePatientPlanRequest $request)
    {
        $data = $request->validated();
        $billingType = $data['billing_type'] ?? 'appointments';
        $isMonthly = $billingType === 'monthly';

        // Define o profissional responsável: terapeuta só pode atribuir a si mesmo
        $professionalId = $this->isTherapist()
            ? auth()->id()
            : ($data['professional_id'] ?? auth()->id());

        $patientPlan = DB::transaction(function () use ($data, $isMonthly, $professionalId) {
            $startDate = Carbon::parse($data['start_date']);

            $patientPlan = PatientPlan::create([
                'patient_id' => $data['patient_id'],
                'plan_id' => $data['plan_id'] ?? null,
                'service_type_id' => $data['service_type_id'],
                'room_id' => $data['room_id'],
                'professional_id' => $professionalId,
                'name' => $data['name'],
                'number_of_appointments' => $data['number_of_appointments'] ?? 0,
                'duration_minutes' => $data['duration_minutes'],
                'billing_type' => $data['billing_type'] ?? 'appointments',
                'price' => $data['price'] ?? 0,
                'remaining_appointments' => $data['number_of_appointments'] ?? 0,
                'schedule_rules' => $data['schedule_rules'],
                'status' => 'active',
                'start_date' => $startDate->toDateString(),
                'has_evaluation' => $data['has_evaluation'] ?? false,
                'evaluation_price' => $data['evaluation_price'] ?? null,
                'evaluation_duration_minutes' => $data['evaluation_duration_minutes'] ?? null,
                'evaluation_date' => $data['evaluation_date'] ?? null,
                'evaluation_time' => $data['evaluation_time'] ?? null,
                'evaluation_room_id' => $data['evaluation_room_id'] ?? null,
            ]);

            // Cria o ciclo de tratamento vinculado ao plano
            $cycle = TreatmentCycle::create([
                'tenant_id' => $patientPlan->tenant_id,
                'patient_id' => $patientPlan->patient_id,
                'patient_plan_id' => $patientPlan->id,
                'title' => $patientPlan->name,
                'status' => 'in_progress',
                'start_date' => $startDate->toDateString(),
            ]);
            $cycle->serviceTypes()->sync([
                $patientPlan->service_type_id => ['tenant_id' => $patientPlan->tenant_id],
            ]);

            // Cria atendimento de avaliação se configurado
            if ($patientPlan->has_evaluation) {
                $this->createEvaluationAppointment($patientPlan, $cycle, $data['is_paid'] ?? false);
            }

            // Gera atendimentos regulares
            $generatedCount = $this->generateAppointments($patientPlan, $cycle);

            // Para planos mensais, atualiza a quantidade real gerada
            if ($isMonthly) {
                $patientPlan->update([
                    'number_of_appointments' => $generatedCount,
                    'remaining_appointments' => $generatedCount,
                ]);
                $patientPlan->refresh();
            }

            // Registra o plano inicial como extensão 0
            $patientPlan->extensions()->create([
                'tenant_id' => $patientPlan->tenant_id,
                'type' => 'initial',
                'quantity' => $patientPlan->number_of_appointments,
                'price' => $data['price'] ?? 0,
                'is_paid' => $data['is_paid'] ?? false,
            ]);

            return $patientPlan;
        });

        return response()->json([
            'message' => 'Plano atribuído com sucesso.',
            'patient_plan' => $patientPlan->load(['patient', 'serviceType', 'room', 'plan', 'professional', 'evaluationRoom', 'extensions']),
        ], 201);
    }

    public function show(PatientPlan $patientPlan)
    {
        return response()->json([
            'patient_plan' => $patientPlan->load([
                'patient', 'serviceType', 'room', 'plan', 'professional', 'evaluationRoom',
                'appointments', 'extensions',
            ]),
        ]);
    }

    public function update(UpdatePatientPlanRequest $request, PatientPlan $patientPlan)
    {
        $data = $request->validated();

        // Terapeuta não pode reatribuir o plano para outro profissional
        if ($this->isTherapist()) {
            $data['professional_id'] = $patientPlan->professional_id ?? auth()->id();
        }

        $shouldReschedule = $request->boolean('reschedule_future_appointments');
        $isMonthly = ($data['billing_type'] ?? $patientPlan->billing_type) === 'monthly';

        if ($shouldReschedule && $patientPlan->status !== 'active') {
            return response()->json([
                'message' => 'Não é possível reagendar atendimentos de um plano que não está ativo.',
            ], 422);
        }

        $patientPlan = DB::transaction(function () use ($patientPlan, $data, $shouldReschedule, $isMonthly) {
            $oldHasEvaluation = $patientPlan->has_evaluation;
            $oldProfessionalId = $patientPlan->professional_id;

            $patientPlan->update([
                'name' => $data['name'] ?? $patientPlan->name,
                'service_type_id' => $data['service_type_id'] ?? $patientPlan->service_type_id,
                'room_id' => $data['room_id'] ?? $patientPlan->room_id,
                'professional_id' => $data['professional_id'] ?? $patientPlan->professional_id,
                'number_of_appointments' => $data['number_of_appointments'] ?? $patientPlan->number_of_appointments,
                'duration_minutes' => $data['duration_minutes'] ?? $patientPlan->duration_minutes,
                'billing_type' => $data['billing_type'] ?? $patientPlan->billing_type,
                'price' => $data['price'] ?? $patientPlan->price,
                'schedule_rules' => $data['schedule_rules'] ?? $patientPlan->schedule_rules,
                'status' => $data['status'] ?? $patientPlan->status,
                'start_date' => $data['start_date'] ?? $patientPlan->start_date,
                'has_evaluation' => $data['has_evaluation'] ?? $patientPlan->has_evaluation,
                'evaluation_price' => $data['evaluation_price'] ?? $patientPlan->evaluation_price,
                'evaluation_duration_minutes' => $data['evaluation_duration_minutes'] ?? $patientPlan->evaluation_duration_minutes,
                'evaluation_date' => $data['evaluation_date'] ?? $patientPlan->evaluation_date,
                'evaluation_time' => $data['evaluation_time'] ?? $patientPlan->evaluation_time,
                'evaluation_room_id' => $data['evaluation_room_id'] ?? $patientPlan->evaluation_room_id,
            ]);

            $cycle = TreatmentCycle::where('patient_plan_id', $patientPlan->id)->first();

            if ($shouldReschedule) {
                // Remove atendimentos regulares agendados (não avaliações)
                $patientPlan->appointments()
                    ->where('status', 'scheduled')
                    ->where('is_evaluation', false)
                    ->delete();

                // Atualiza avaliação
                $this->syncEvaluationAppointment($patientPlan, $cycle, $oldHasEvaluation);

                // Regenera atendimentos regulares
                $generatedCount = $this->generateAppointments($patientPlan, $cycle);

                // Recalcula quantidade para planos mensais
                if ($isMonthly) {
                    $patientPlan->update([
                        'number_of_appointments' => $generatedCount,
                        'remaining_appointments' => $generatedCount,
                    ]);
                }
            } else {
                // Apenas sincroniza avaliação se o flag mudou
                if (isset($data['has_evaluation']) && $data['has_evaluation'] != $oldHasEvaluation) {
                    $this->syncEvaluationAppointment($patientPlan, $cycle, $oldHasEvaluation);
                }

                // Se o profissional mudou, reatribui os atendimentos agendados
                if ($patientPlan->professional_id !== $oldProfessionalId) {
                    $patientPlan->appointments()
                        ->where('status', 'scheduled')
                        ->update(['professional_id' => $patientPlan->professional_id]);
                }
            }

            return $patientPlan;
        });

        return response()->json([
            'message' => 'Plano do paciente atualizado com sucesso.',
            'patient_plan' => $patientPlan->load([
                'patient', 'serviceType', 'room', 'plan', 'professional', 'evaluationRoom', 'appointments', 'extensions',
            ]),
        ]);
    }

    public function extend(ExtendPatientPlanRequest $request, PatientPlan $patientPlan)
    {
        if ($patientPlan->status !== 'active') {
            return response()->json([
                'message' => 'Não é possível renovar um plano que não está ativo.',
            ], 422);
        }

        $isMonthly = $patientPlan->isMonthly();

        $patientPlan = DB::transaction(function () use ($patientPlan, $isMonthly) {
            $cycle = TreatmentCycle::where('patient_plan_id', $patientPlan->id)->firstOrFail();

            if ($isMonthly) {
                $generatedCount = $this->generateMonthlyAppointments($patientPlan, $cycle);
                $quantity = $generatedCount;
            } else {
                $quantity = request()->input('quantity', $patientPlan->number_of_appointments);
                $this->generateAppointmentsByQuantity($patientPlan, $cycle, $quantity);
            }

            $patientPlan->increment('remaining_appointments', $quantity);
            $patientPlan->increment('number_of_appointments', $quantity);

            // Registra a extensão no histórico
            $patientPlan->extensions()->create([
                'tenant_id' => $patientPlan->tenant_id,
                'type' => 'extension',
                'quantity' => $quantity,
                'price' => $patientPlan->price,
                'is_paid' => false,
            ]);

            return $patientPlan;
        });

        return response()->json([
            'message' => 'Plano estendido com sucesso.',
            'patient_plan' => $patientPlan->load([
                'patient', 'serviceType', 'room', 'plan', 'professional', 'evaluationRoom', 'appointments', 'extensions',
            ]),
        ]);
    }

    public function destroy(PatientPlan $patientPlan)
    {
        DB::transaction(function () use ($patientPlan) {
            // Remove o ciclo de tratamento vinculado, avaliações e atendimentos
            $cycle = TreatmentCycle::where('patient_plan_id', $patientPlan->id)->first();
            if ($cycle) {
                $cycle->serviceTypes()->detach();
                $cycle->evaluations()->delete();
                $cycle->appointments()->delete();
                $cycle->delete();
            }

            $patientPlan->appointments()->delete();
            $patientPlan->extensions()->delete();
            $patientPlan->delete();
        });

        return response()->json([
            'message' => 'Plano do paciente removido com sucesso.',
        ]);
    }

    public function finish(PatientPlan $patientPlan)
    {
        if ($patientPlan->status !== 'active') {
            return response()->json([
                'message' => 'Apenas planos ativos podem ser encerrados.',
            ], 422);
        }

        $patientPlan->update(['status' => 'finished']);

        return response()->json([
            'message' => 'Plano encerrado com sucesso. Os atendimentos já agendados foram mantidos.',
            'patient_plan' => $patientPlan->load(['patient', 'serviceType', 'room', 'plan', 'professional', 'extensions', 'appointments']),
        ]);
    }

    public function reopen(PatientPlan $patientPlan)
    {
        if ($patientPlan->status === 'active') {
            return response()->json([
                'message' => 'O plano já está ativo.',
            ], 422);
        }

        $patientPlan->update(['status' => 'active']);

        return response()->json([
            'message' => 'Plano reativado com sucesso.',
            'patient_plan' => $patientPlan->load(['patient', 'serviceType', 'room', 'plan', 'professional', 'extensions', 'appointments']),
        ]);
    }

    public function toggleExtensionPayment(Request $request, PatientPlanExtension $extension)
    {
        $extension->update(['is_paid' => ! $extension->is_paid]);

        return response()->json([
            'message' => 'Status de pagamento atualizado.',
            'extension' => $extension,
        ]);
    }

    public function toggleEvaluationPayment(Request $request, Appointment $appointment)
    {
        if (! $appointment->is_evaluation) {
            return response()->json(['message' => 'Este atendimento não é uma avaliação.'], 422);
        }

        $appointment->update(['is_paid' => ! $appointment->is_paid]);

        return response()->json([
            'message' => 'Status de pagamento da avaliação atualizado.',
            'appointment' => $appointment,
        ]);
    }

    public function history(PatientPlan $patientPlan)
    {
        $patientPlan->load([
            'patient', 'serviceType', 'room', 'plan', 'professional', 'evaluationRoom',
            'extensions', 'appointments.room',
        ]);

        $completedAppointments = $patientPlan->appointments
            ->whereIn('status', ['completed', 'missed'])
            ->sortByDesc('appointment_date')
            ->values();

        $evaluations = $patientPlan->appointments
            ->where('is_evaluation', true)
            ->sortByDesc('appointment_date')
            ->values();

        $totalPending = $patientPlan->extensions
            ->where('is_paid', false)
            ->sum('price');

        $totalPending += $evaluations
            ->where('is_paid', false)
            ->sum(fn ($app) => $app->price ?? 0);

        return response()->json([
            'patient_plan' => $patientPlan,
            'completed_appointments' => $completedAppointments,
            'evaluations' => $evaluations,
            'total_pending' => $totalPending,
        ]);
    }

    private function createEvaluationAppointment(PatientPlan $patientPlan, TreatmentCycle $cycle, bool $isPaid)
    {
        $this->validateRoomCapacity(
            $patientPlan->evaluation_room_id,
            $patientPlan->evaluation_date,
            $patientPlan->evaluation_time
        );

        Appointment::create([
            'tenant_id' => $patientPlan->tenant_id,
            'treatment_cycle_id' => $cycle->id,
            'patient_plan_id' => $patientPlan->id,
            'patient_id' => $patientPlan->patient_id,
            'room_id' => $patientPlan->evaluation_room_id,
            'professional_id' => $patientPlan->professional_id ?? auth()->id(),
            'appointment_date' => $patientPlan->evaluation_date,
            'start_time' => $patientPlan->evaluation_time,
            'duration_minutes' => $patientPlan->evaluation_duration_minutes,
            'price' => $patientPlan->evaluation_price,
            'is_paid' => $isPaid,
            'status' => 'scheduled',
            'is_evaluation' => true,
            'created_by' => auth()->id(),
        ]);
    }

    private function syncEvaluationAppointment(PatientPlan $patientPlan, ?TreatmentCycle $cycle, bool $oldHasEvaluation)
    {
        if (! $cycle) {
            return;
        }

        // Remove avaliação existente agendada se houver
        $patientPlan->appointments()
            ->where('is_evaluation', true)
            ->where('status', 'scheduled')
            ->delete();

        if ($patientPlan->has_evaluation) {
            $this->createEvaluationAppointment($patientPlan, $cycle, false);
        }
    }

    private function generateAppointments(PatientPlan $patientPlan, TreatmentCycle $cycle): int
    {
        if ($patientPlan->isMonthly()) {
            return $this->generateMonthlyAppointments($patientPlan, $cycle);
        }

        $quantity = $patientPlan->number_of_appointments;
        $this->generateAppointmentsByQuantity($patientPlan, $cycle, $quantity);

        return $quantity;
    }

    private function generateAppointmentsByQuantity(PatientPlan $patientPlan, TreatmentCycle $cycle, ?int $quantity = null)
    {
        $quantity = $quantity ?? $patientPlan->number_of_appointments;
        $rules = $patientPlan->schedule_rules;

        if (empty($rules) || $quantity <= 0) {
            return;
        }

        $activeDays = $this->parseScheduleRules($rules);

        if (empty($activeDays)) {
            return;
        }

        // Se for extensão, começa após o último atendimento regular agendado.
        // Caso contrário, começa na start_date do plano.
        $lastAppointment = $patientPlan->appointments()
            ->where('status', 'scheduled')
            ->where('is_evaluation', false)
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time')
            ->first();

        $startDate = $lastAppointment
            ? Carbon::parse($lastAppointment->appointment_date)->addDay()
            : Carbon::parse($patientPlan->start_date);

        $created = 0;
        $currentDate = $startDate->copy();

        while ($created < $quantity) {
            $weekday = $currentDate->dayOfWeek;

            foreach ($activeDays as $rule) {
                if ($rule['weekday'] !== $weekday) {
                    continue;
                }

                $this->validateRoomCapacity($patientPlan->room_id, $currentDate->toDateString(), $rule['time']);

                Appointment::create([
                    'tenant_id' => $patientPlan->tenant_id,
                    'treatment_cycle_id' => $cycle->id,
                    'patient_plan_id' => $patientPlan->id,
                    'patient_id' => $patientPlan->patient_id,
                    'room_id' => $patientPlan->room_id,
                    'professional_id' => $patientPlan->professional_id ?? auth()->id(),
                    'appointment_date' => $currentDate->toDateString(),
                    'start_time' => $rule['time'],
                    'duration_minutes' => $patientPlan->duration_minutes,
                    'status' => 'scheduled',
                    'is_evaluation' => false,
                    'created_by' => auth()->id(),
                ]);

                $created++;

                if ($created >= $quantity) {
                    break 2;
                }
            }

            $currentDate->addDay();
        }
    }

    private function generateMonthlyAppointments(PatientPlan $patientPlan, TreatmentCycle $cycle): int
    {
        $rules = $patientPlan->schedule_rules;
        $activeDays = $this->parseScheduleRules($rules);

        if (empty($activeDays)) {
            return 0;
        }

        // Último atendimento regular agendado (avaliações não entram)
        $lastAppointment = $patientPlan->appointments()
            ->where('status', 'scheduled')
            ->where('is_evaluation', false)
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time')
            ->first();

        if ($lastAppointment) {
            $startDate = Carbon::parse($lastAppointment->appointment_date)->addDay();
        } else {
            $startDate = Carbon::parse($patientPlan->start_date);
        }

        $endDate = $startDate->copy()->addMonth()->subDay();
        $created = 0;
        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            $weekday = $currentDate->dayOfWeek;

            foreach ($activeDays as $rule) {
                if ($rule['weekday'] !== $weekday) {
                    continue;
                }

                $this->validateRoomCapacity($patientPlan->room_id, $currentDate->toDateString(), $rule['time']);

                Appointment::create([
                    'tenant_id' => $patientPlan->tenant_id,
                    'treatment_cycle_id' => $cycle->id,
                    'patient_plan_id' => $patientPlan->id,
                    'patient_id' => $patientPlan->patient_id,
                    'room_id' => $patientPlan->room_id,
                    'professional_id' => $patientPlan->professional_id ?? auth()->id(),
                    'appointment_date' => $currentDate->toDateString(),
                    'start_time' => $rule['time'],
                    'duration_minutes' => $patientPlan->duration_minutes,
                    'status' => 'scheduled',
                    'is_evaluation' => false,
                    'created_by' => auth()->id(),
                ]);

                $created++;
            }

            $currentDate->addDay();
        }

        return $created;
    }

    private function parseScheduleRules(array $rules): array
    {
        $weekdayMap = [
            'sunday' => 0, 'monday' => 1, 'tuesday' => 2, 'wednesday' => 3,
            'thursday' => 4, 'friday' => 5, 'saturday' => 6,
        ];

        $activeDays = [];
        foreach ($rules as $day => $time) {
            if (isset($weekdayMap[$day]) && $time) {
                $activeDays[] = ['weekday' => $weekdayMap[$day], 'time' => $time];
            }
        }

        return $activeDays;
    }

    private function validateRoomCapacity(int $roomId, string $date, string $time)
    {
        $room = \App\Models\Room::findOrFail($roomId);

        $existingAppointments = Appointment::where('room_id', $roomId)
            ->where('appointment_date', $date)
            ->where('start_time', $time)
            ->whereIn('status', ['scheduled', 'completed'])
            ->count();

        if ($existingAppointments >= $room->capacity) {
            throw new \Exception("A sala {$room->name} atingiu a capacidade máxima para {$date} às {$time}.");
        }
    }
}
