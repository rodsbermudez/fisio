<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceTypeRequest;
use App\Http\Requests\UpdateServiceTypeRequest;
use App\Models\ServiceType;
use Illuminate\Http\Request;

class ServiceTypeController extends Controller
{
    public function index(Request $request)
    {
        $serviceTypes = $this->scopeToTenant(ServiceType::withCount('treatmentCycles'))
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->has('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->latest()
            ->paginate(20);

        return response()->json($serviceTypes);
    }

    public function store(StoreServiceTypeRequest $request)
    {
        $data = $request->validated();
        $data['tenant_id'] = $this->currentTenantId();

        $serviceType = ServiceType::create($data);

        return response()->json([
            'message' => 'Tipo de atendimento criado com sucesso.',
            'service_type' => $serviceType,
        ], 201);
    }

    public function show(ServiceType $serviceType)
    {
        $this->authorizeTenant($serviceType);

        return response()->json([
            'service_type' => $serviceType->loadCount('treatmentCycles'),
        ]);
    }

    public function update(UpdateServiceTypeRequest $request, ServiceType $serviceType)
    {
        $this->authorizeTenant($serviceType);

        $serviceType->update($request->validated());

        return response()->json([
            'message' => 'Tipo de atendimento atualizado com sucesso.',
            'service_type' => $serviceType,
        ]);
    }

    public function destroy(ServiceType $serviceType)
    {
        $this->authorizeTenant($serviceType);

        $serviceType->delete();

        return response()->json([
            'message' => 'Tipo de atendimento excluído com sucesso.',
        ]);
    }
}
