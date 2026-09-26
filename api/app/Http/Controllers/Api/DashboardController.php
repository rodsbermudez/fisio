<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\PatientPlan;
use App\Models\Plan;
use App\Models\Room;
use App\Models\ServiceType;
use App\Models\Template;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;
        $isTherapist = $user->isTherapist();
        $selectedDate = $request->query('date', Carbon::today()->toDateString());
        $today = Carbon::today()->toDateString();
        $startOfWeek = Carbon::now()->startOfWeek()->toDateString();
        $endOfWeek = Carbon::now()->endOfWeek()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $activePatientsCount = Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->count();

        $todayAppointmentsQuery = Appointment::with(['patient', 'room', 'treatmentCycle', 'patientPlan', 'professional'])
            ->where('tenant_id', $tenantId)
            ->where('appointment_date', $selectedDate)
            ->when($isTherapist, fn ($q) => $q->where('professional_id', $user->id))
            ->orderBy('start_time');

        $todayAppointments = $todayAppointmentsQuery->get();

        $weekAppointmentsCount = Appointment::where('tenant_id', $tenantId)
            ->whereBetween('appointment_date', [$startOfWeek, $endOfWeek])
            ->when($isTherapist, fn ($q) => $q->where('professional_id', $user->id))
            ->count();

        $activePlansCount = PatientPlan::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->count();

        $appointmentsByStatus = Appointment::where('tenant_id', $tenantId)
            ->when($isTherapist, fn ($q) => $q->where('professional_id', $user->id))
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $birthdaysThisMonth = Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNotNull('birth_date')
            ->whereRaw('MONTH(birth_date) = ?', [Carbon::now()->month])
            ->orderByRaw('DAY(birth_date)')
            ->get(['id', 'name', 'birth_date']);

        $pendingEvaluationsCount = Appointment::where('tenant_id', $tenantId)
            ->where('is_evaluation', true)
            ->where('status', 'scheduled')
            ->when($isTherapist, fn ($q) => $q->where('professional_id', $user->id))
            ->count();

        $completedAppointmentsThisMonth = Appointment::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereBetween('appointment_date', [$startOfMonth, $endOfMonth])
            ->when($isTherapist, fn ($q) => $q->where('professional_id', $user->id))
            ->count();

        $nextAppointments = Appointment::with(['patient', 'room'])
            ->where('tenant_id', $tenantId)
            ->where('appointment_date', '>=', $today)
            ->whereIn('status', ['scheduled'])
            ->when($isTherapist, fn ($q) => $q->where('professional_id', $user->id))
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        $onboarding = [
            'has_service_types' => ServiceType::where('tenant_id', $tenantId)->exists(),
            'has_rooms' => Room::where('tenant_id', $tenantId)->exists(),
            'has_plans' => Plan::where('tenant_id', $tenantId)->exists(),
            'has_templates' => Template::where('tenant_id', $tenantId)->exists(),
        ];

        return response()->json([
            'active_patients_count' => $activePatientsCount,
            'today_appointments' => $todayAppointments,
            'today_appointments_count' => $todayAppointments->count(),
            'week_appointments_count' => $weekAppointmentsCount,
            'active_plans_count' => $activePlansCount,
            'appointments_by_status' => $appointmentsByStatus,
            'birthdays_this_month' => $birthdaysThisMonth,
            'pending_evaluations_count' => $pendingEvaluationsCount,
            'completed_appointments_this_month' => $completedAppointmentsThisMonth,
            'next_appointments' => $nextAppointments,
            'onboarding' => $onboarding,
        ]);
    }
}
