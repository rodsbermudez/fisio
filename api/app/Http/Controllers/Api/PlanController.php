<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlanRequest;
use App\Http\Requests\UpdatePlanRequest;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $plans = $this->scopeToTenant(Plan::with(['serviceType']))
            ->withCount('patientPlans')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->has('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->latest()
            ->paginate(20);

        return response()->json($plans);
    }

    public function store(StorePlanRequest $request)
    {
        $data = $request->validated();
        $data['tenant_id'] = $this->currentTenantId();

        $plan = Plan::create($data);

        return response()->json([
            'message' => 'Plano criado com sucesso.',
            'plan' => $plan->load('serviceType'),
        ], 201);
    }

    public function show(Plan $plan)
    {
        $this->authorizeTenant($plan);

        return response()->json([
            'plan' => $plan->load(['serviceType'])->loadCount('patientPlans'),
        ]);
    }

    public function update(UpdatePlanRequest $request, Plan $plan)
    {
        $this->authorizeTenant($plan);

        $plan->update($request->validated());

        return response()->json([
            'message' => 'Plano atualizado com sucesso.',
            'plan' => $plan->load('serviceType'),
        ]);
    }

    public function destroy(Plan $plan)
    {
        $this->authorizeTenant($plan);

        $plan->delete();

        return response()->json([
            'message' => 'Plano excluído com sucesso.',
        ]);
    }
}
