<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\TreatmentCycle;
use Illuminate\Http\Request;

class TreatmentCycleController extends Controller
{
    public function index(Request $request)
    {
        $query = TreatmentCycle::with(['patient', 'evaluations', 'serviceTypes', 'patientPlan']);

        if ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string|max:2000',
            'status' => 'nullable|in:in_progress,finished',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'service_type_ids' => 'required|array|min:1',
            'service_type_ids.*' => 'exists:service_types,id',
        ]);

        $cycle = TreatmentCycle::create($data);

        $syncData = collect($data['service_type_ids'])
            ->mapWithKeys(fn ($id) => [$id => ['tenant_id' => auth()->user()->tenant_id]])
            ->toArray();
        $cycle->serviceTypes()->sync($syncData);

        return response()->json([
            'message' => 'Ciclo de tratamento criado com sucesso.',
            'treatment_cycle' => $cycle->load(['patient', 'serviceTypes']),
        ], 201);
    }

    public function show(TreatmentCycle $treatmentCycle)
    {
        return response()->json([
            'treatment_cycle' => $treatmentCycle->load(['patient', 'evaluations', 'serviceTypes', 'patientPlan']),
        ]);
    }

    public function update(Request $request, TreatmentCycle $treatmentCycle)
    {
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string|max:2000',
            'status' => 'nullable|in:in_progress,finished',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'service_type_ids' => 'sometimes|required|array|min:1',
            'service_type_ids.*' => 'exists:service_types,id',
        ]);

        $treatmentCycle->update($data);

        if (isset($data['service_type_ids'])) {
            $syncData = collect($data['service_type_ids'])
                ->mapWithKeys(fn ($id) => [$id => ['tenant_id' => auth()->user()->tenant_id]])
                ->toArray();
            $treatmentCycle->serviceTypes()->sync($syncData);
        }

        return response()->json([
            'message' => 'Ciclo de tratamento atualizado com sucesso.',
            'treatment_cycle' => $treatmentCycle->load('serviceTypes'),
        ]);
    }

    public function destroy(TreatmentCycle $treatmentCycle)
    {
        $treatmentCycle->delete();

        return response()->json([
            'message' => 'Ciclo de tratamento excluído com sucesso.',
        ]);
    }
}
