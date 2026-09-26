<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = $this->scopeToTenant(
            Patient::with(['patientPlans.extensions', 'patientPlans.appointments'])
        );

        // Busca por nome, CPF ou email
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('cpf', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtro por status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $patients = $query->orderBy('name')->paginate($request->query('per_page', 15));

        return response()->json($patients);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePatientRequest $request)
    {
        $data = $request->validated();
        $data['tenant_id'] = $this->currentTenantId();

        $patient = Patient::create($data);

        return response()->json([
            'message' => 'Paciente criada com sucesso.',
            'patient' => $patient,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient)
    {
        $this->authorizeTenant($patient);

        $patient->load(['patientPlans.extensions', 'patientPlans.appointments']);

        return response()->json([
            'patient' => $patient,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePatientRequest $request, Patient $patient)
    {
        $this->authorizeTenant($patient);

        $patient->update($request->validated());

        return response()->json([
            'message' => 'Paciente atualizada com sucesso.',
            'patient' => $patient,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient)
    {
        $this->authorizeTenant($patient);

        $patient->delete();

        return response()->json([
            'message' => 'Paciente excluída com sucesso.',
        ]);
    }
}
