<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\PatientPlanController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\ServiceTypeController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\TreatmentCycleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\TenantController as AdminTenantController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'Fisio API',
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
    Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Users / Employees (owner only)
    Route::apiResource('users', UserController::class);
    Route::get('/professionals', [UserController::class, 'professionals']);

    // Patients CRUD
    Route::apiResource('patients', PatientController::class);

    // Templates (Form Builder)
    Route::apiResource('templates', TemplateController::class);

    // Treatment Cycles
    Route::apiResource('treatment-cycles', TreatmentCycleController::class);

    // Service Types
    Route::apiResource('service-types', ServiceTypeController::class);

    // Rooms
    Route::apiResource('rooms', RoomController::class);

    // Plans
    Route::apiResource('plans', PlanController::class);

    // Patient Plans
    Route::apiResource('patient-plans', PatientPlanController::class);
    Route::post('/patient-plans/{patient_plan}/extend', [PatientPlanController::class, 'extend']);
    Route::patch('/patient-plans/{patient_plan}/finish', [PatientPlanController::class, 'finish']);
    Route::patch('/patient-plans/{patient_plan}/reopen', [PatientPlanController::class, 'reopen']);
    Route::get('/patient-plans/{patient_plan}/history', [PatientPlanController::class, 'history']);
    Route::patch('/patient-plan-extensions/{extension}/toggle-payment', [PatientPlanController::class, 'toggleExtensionPayment']);
    Route::patch('/appointments/{appointment}/toggle-evaluation-payment', [PatientPlanController::class, 'toggleEvaluationPayment']);

    // Appointments
    Route::get('/appointments/calendar', [AppointmentController::class, 'calendar']);
    Route::post('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
    Route::apiResource('appointments', AppointmentController::class);

    // Evaluations
    Route::apiResource('evaluations', EvaluationController::class);
    Route::post('/evaluations/{evaluation}/finalize', [EvaluationController::class, 'finalize']);
    Route::post('/evaluations/{evaluation}/unfinalize', [EvaluationController::class, 'unfinalize']);
});

// Admin routes (platform management)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    Route::apiResource('tenants', AdminTenantController::class);
    Route::get('/tenants/{tenant}/users', [AdminUserController::class, 'index']);
    Route::post('/tenants/{tenant}/impersonate', [AdminUserController::class, 'impersonate']);
});
