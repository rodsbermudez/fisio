<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\PatientPlan;
use App\Models\Tenant;
use App\Models\User;
use App\Scopes\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantsCount = Tenant::count();
        $activeTenantsCount = Tenant::where('is_active', true)->count();
        $inactiveTenantsCount = Tenant::where('is_active', false)->count();

        $usersCount = User::withoutGlobalScope(TenantScope::class)->count();
        $patientsCount = Patient::withoutGlobalScope(TenantScope::class)->count();
        $appointmentsCount = Appointment::withoutGlobalScope(TenantScope::class)->count();
        $activePlansCount = PatientPlan::withoutGlobalScope(TenantScope::class)
            ->where('status', 'active')
            ->count();

        $recentTenants = Tenant::withCount(['users', 'patients'])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'tenants_count' => $tenantsCount,
            'active_tenants_count' => $activeTenantsCount,
            'inactive_tenants_count' => $inactiveTenantsCount,
            'users_count' => $usersCount,
            'patients_count' => $patientsCount,
            'appointments_count' => $appointmentsCount,
            'active_plans_count' => $activePlansCount,
            'recent_tenants' => $recentTenants,
        ]);
    }
}
