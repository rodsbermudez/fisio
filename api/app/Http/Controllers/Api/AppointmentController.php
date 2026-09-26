<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RescheduleAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['patient', 'room', 'treatmentCycle', 'patientPlan', 'professional']);

        if ($this->isTherapist()) {
            $query->where('professional_id', auth()->id());
        }

        if ($request->treatment_cycle_id) {
            $query->where('treatment_cycle_id', $request->treatment_cycle_id);
        }

        if ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->room_id) {
            $query->where('room_id', $request->room_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date_from && $request->date_to) {
            $query->whereBetween('appointment_date', [$request->date_from, $request->date_to]);
        }

        return response()->json($query->latest('appointment_date')->latest('start_time')->paginate(50));
    }

    public function store(StoreAppointmentRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();

        // Therapists can only schedule appointments for themselves
        if ($this->isTherapist()) {
            $data['professional_id'] = auth()->id();
        } else {
            $data['professional_id'] = $data['professional_id'] ?? auth()->id();
        }

        $patientPlan = null;
        if (! empty($data['patient_plan_id'])) {
            $patientPlan = \App\Models\PatientPlan::find($data['patient_plan_id']);
        }

        if (! empty($data['is_evaluation'])) {
            // Avaliações são permitidas (cobradas à parte), inclusive com plano encerrado,
            // desde que o plano permita avaliação.
            if (! $patientPlan && ! empty($data['treatment_cycle_id'])) {
                $cycle = \App\Models\TreatmentCycle::find($data['treatment_cycle_id']);
                $patientPlan = $cycle?->patientPlan;
                if ($patientPlan) {
                    $data['patient_plan_id'] = $patientPlan->id;
                }
            }

            if (! $patientPlan || ! $patientPlan->has_evaluation) {
                return response()->json([
                    'message' => 'Este ciclo não permite agendamento de avaliação.',
                ], 422);
            }

            $data['price'] = $patientPlan->evaluation_price;
        } elseif ($patientPlan) {
            if ($patientPlan->billing_type === 'appointments') {
                // Planos por quantidade: limitados ao saldo de aulas (créditos),
                // que podem ser usados mesmo com o plano encerrado.
                if ($patientPlan->schedulable_appointments <= 0) {
                    return response()->json([
                        'message' => 'Não há saldo de aulas disponível para agendar novos atendimentos neste plano.',
                    ], 422);
                }
            } elseif ($patientPlan->status !== 'active') {
                return response()->json([
                    'message' => 'Não é possível adicionar atendimentos a um plano que não está ativo.',
                ], 422);
            }
        }

        if ($data['status'] === 'completed') {
            $data['completed_at'] = now();
        }

        $appointment = Appointment::create($data);

        // Atualiza saldo do plano se o status inicial já consumir aula
        if ($appointment->patient_plan_id && $this->consumesQuota($appointment->status)) {
            $appointment->patientPlan->decrement('remaining_appointments');
        }

        return response()->json([
            'message' => 'Atendimento criado com sucesso.',
            'appointment' => $appointment->load(['patient', 'room', 'treatmentCycle', 'patientPlan', 'professional']),
        ], 201);
    }

    public function show(Appointment $appointment)
    {
        return response()->json([
            'appointment' => $appointment->load(['patient', 'room', 'treatmentCycle', 'professional']),
        ]);
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment)
    {
        $data = $request->validated();

        // Therapists cannot reassign appointments to another professional
        if ($this->isTherapist() && isset($data['professional_id']) && $data['professional_id'] != auth()->id()) {
            unset($data['professional_id']);
        }

        if (isset($data['status']) && $data['status'] === 'completed' && ! $appointment->completed_at) {
            $data['completed_at'] = now();
        }

        if (isset($data['status']) && $data['status'] !== 'completed') {
            $data['completed_at'] = null;
        }

        $oldStatus = $appointment->status;
        $newStatus = $data['status'] ?? $oldStatus;

        $appointment->update($data);

        // Atualiza saldo do plano atribuído
        if ($appointment->patient_plan_id) {
            $this->adjustPatientPlanRemaining(
                $appointment->patientPlan,
                $oldStatus,
                $newStatus
            );
        }

        return response()->json([
            'message' => 'Atendimento atualizado com sucesso.',
            'appointment' => $appointment->load(['patient', 'room', 'treatmentCycle', 'patientPlan', 'professional']),
        ]);
    }

    public function destroy(Appointment $appointment)
    {
        if ($appointment->patient_plan_id && $this->consumesQuota($appointment->status)) {
            $appointment->patientPlan->increment('remaining_appointments');
        }

        $appointment->delete();

        return response()->json([
            'message' => 'Atendimento excluído com sucesso.',
        ]);
    }

    public function calendar(Request $request)
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'room_id' => 'nullable|exists:rooms,id',
            'professional_id' => 'nullable|exists:users,id',
        ]);

        $user = auth()->user();
        $isOwner = $user->isOwner();
        $userId = $user->id;

        $query = Appointment::with(['patient', 'room', 'treatmentCycle', 'patientPlan', 'professional'])
            ->whereBetween('appointment_date', [$request->from, $request->to])
            ->whereIn('status', ['scheduled', 'completed']);

        if ($request->room_id) {
            $query->where('room_id', $request->room_id);
        }

        if ($request->professional_id) {
            // Therapists can only filter by themselves
            if (! $isOwner && (int) $request->professional_id !== $userId) {
                $request->merge(['professional_id' => $userId]);
            }
            $query->where('professional_id', $request->professional_id);
        }

        $appointments = $query->get();

        $appointments->each(function ($appointment) use ($isOwner, $userId) {
            $appointment->is_mine = (int) $appointment->professional_id === $userId;
            $appointment->can_view_details = $isOwner || $appointment->is_mine;

            if (! $appointment->can_view_details) {
                $appointment->makeHidden(['evolution_notes']);
                if ($appointment->patient) {
                    $appointment->patient->name = 'Ocupado';
                    $appointment->patient->makeHidden(['email', 'phone', 'cpf', 'birth_date', 'profession', 'street', 'number', 'neighborhood', 'complement', 'zip_code', 'city', 'state', 'emergency_contact_name', 'emergency_contact_phone']);
                }
            }
        });

        return response()->json([
            'appointments' => $appointments,
        ]);
    }

    public function reschedule(RescheduleAppointmentRequest $request, Appointment $appointment)
    {
        $data = $request->validated();

        $room = Room::findOrFail($data['room_id']);
        $appointmentDate = $data['appointment_date'];
        $startTime = $data['start_time'];

        $occupiedSlots = Appointment::where('room_id', $room->id)
            ->where('appointment_date', $appointmentDate)
            ->where('start_time', $startTime)
            ->whereIn('status', ['scheduled', 'completed'])
            ->where('id', '!=', $appointment->id)
            ->count();

        if ($occupiedSlots >= $room->capacity) {
            return response()->json([
                'message' => 'A sala atingiu a capacidade máxima neste horário.',
            ], 422);
        }

        $appointment->update([
            'room_id' => $room->id,
            'appointment_date' => $appointmentDate,
            'start_time' => $startTime,
        ]);

        return response()->json([
            'message' => 'Atendimento remarcado com sucesso.',
            'appointment' => $appointment->load(['patient', 'room', 'treatmentCycle', 'patientPlan', 'professional']),
        ]);
    }

    private function consumesQuota(string $status): bool
    {
        return in_array($status, ['completed', 'missed'], true);
    }

    private function adjustPatientPlanRemaining($patientPlan, string $oldStatus, string $newStatus): void
    {
        $oldConsumed = $this->consumesQuota($oldStatus);
        $newConsumed = $this->consumesQuota($newStatus);

        if (! $oldConsumed && $newConsumed) {
            $patientPlan->decrement('remaining_appointments');
        } elseif ($oldConsumed && ! $newConsumed) {
            $patientPlan->increment('remaining_appointments');
        }
    }
}
