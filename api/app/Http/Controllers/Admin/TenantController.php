<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TenantController extends Controller
{
    /**
     * List tenants with optional search and counts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::withCount(['users', 'patients', 'appointments'])
            ->with(['users' => function ($q) {
                $q->where('role', 'owner')->select('id', 'tenant_id', 'name', 'email', 'role');
            }])
            ->latest();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('document', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($request->query('per_page', 20)));
    }

    /**
     * Store a new tenant and its owner user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:individual,clinic',
            'document' => 'nullable|string|max:20|unique:tenants,document',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'primary_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'is_active' => 'sometimes|boolean',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|string|email|max:255|unique:users,email',
            'owner_password' => 'required|string|min:8',
            'owner_phone' => 'nullable|string|max:20',
            'owner_crm' => 'nullable|string|max:50',
        ]);

        try {
            DB::beginTransaction();

            $tenant = Tenant::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'document' => $validated['document'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'primary_color' => $validated['primary_color'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $owner = User::create([
                'tenant_id' => $tenant->id,
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'password' => Hash::make($validated['owner_password']),
                'role' => 'owner',
                'phone' => $validated['owner_phone'] ?? null,
                'crm' => $validated['owner_crm'] ?? null,
                'is_active' => true,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Clínica criada com sucesso.',
                'tenant' => $tenant->load(['users' => fn ($q) => $q->where('role', 'owner')]),
                'owner' => $owner,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Erro ao criar clínica.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show a tenant with owner and counts.
     */
    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->load([
            'users' => fn ($q) => $q->where('role', 'owner')->select('id', 'tenant_id', 'name', 'email', 'role', 'phone', 'crm', 'is_active'),
        ]);
        $tenant->loadCount(['users', 'patients', 'appointments']);

        return response()->json([
            'tenant' => $tenant,
        ]);
    }

    /**
     * Update tenant data.
     */
    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:individual,clinic',
            'document' => ['sometimes', 'nullable', 'string', 'max:20', Rule::unique('tenants')->ignore($tenant->id)],
            'email' => 'sometimes|nullable|string|email|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
            'primary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'is_active' => 'sometimes|boolean',
        ]);

        $tenant->update($validated);

        return response()->json([
            'message' => 'Clínica atualizada com sucesso.',
            'tenant' => $tenant->fresh(),
        ]);
    }

    /**
     * Soft delete a tenant.
     */
    public function destroy(Tenant $tenant): JsonResponse
    {
        $usersCount = $tenant->users()->count();

        if ($usersCount > 0) {
            return response()->json([
                'message' => 'Não é possível excluir uma clínica que possui usuários.',
            ], 422);
        }

        $tenant->delete();

        return response()->json([
            'message' => 'Clínica removida com sucesso.',
        ]);
    }
}
