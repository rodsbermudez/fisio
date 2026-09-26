<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * List users belonging to the current tenant.
     */
    public function index(Request $request)
    {
        $this->authorizeManagement();

        $query = User::where('tenant_id', $this->currentTenantId())
            ->whereIn('role', ['owner', 'therapist'])
            ->orderBy('name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($request->query('per_page', 20)));
    }

    /**
     * List active professionals of the current tenant for scheduling filters.
     */
    public function professionals(Request $request)
    {
        $professionals = User::where('tenant_id', $this->currentTenantId())
            ->whereIn('role', ['owner', 'therapist'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'crm']);

        return response()->json($professionals);
    }

    /**
     * Store a new employee (therapist) in the tenant.
     */
    public function store(Request $request)
    {
        $this->authorizeManagement();

        if (auth()->user()?->tenant?->type === 'individual') {
            abort(403, 'Profissionais autônomos não podem cadastrar funcionários.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'crm' => 'nullable|string|max:50',
            'role' => ['nullable', Rule::in(['therapist', 'owner'])],
        ]);

        $user = User::create([
            'tenant_id' => $this->currentTenantId(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'therapist',
            'phone' => $validated['phone'] ?? null,
            'crm' => $validated['crm'] ?? null,
        ]);

        return response()->json([
            'message' => 'Funcionário criado com sucesso.',
            'user' => $user,
        ], 201);
    }

    /**
     * Show a tenant user.
     */
    public function show(User $user)
    {
        $this->ensureSameTenant($user);

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Update a tenant user.
     */
    public function update(Request $request, User $user)
    {
        $this->authorizeManagement();
        $this->ensureSameTenant($user);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'crm' => 'nullable|string|max:50',
            'role' => ['nullable', Rule::in(['therapist', 'owner'])],
            'is_active' => 'sometimes|boolean',
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Prevent changing the only owner's role away from owner
        if (isset($validated['role']) && $validated['role'] !== 'owner' && $user->role === 'owner') {
            $ownerCount = User::where('tenant_id', $this->currentTenantId())->where('role', 'owner')->count();
            if ($ownerCount <= 1) {
                throw ValidationException::withMessages([
                    'role' => ['É necessário manter ao menos um owner na clínica.'],
                ]);
            }
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Funcionário atualizado com sucesso.',
            'user' => $user,
        ]);
    }

    /**
     * Soft delete a tenant user.
     */
    public function destroy(User $user)
    {
        $this->authorizeManagement();
        $this->ensureSameTenant($user);

        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Você não pode remover sua própria conta.',
            ], 422);
        }

        if ($user->role === 'owner') {
            $ownerCount = User::where('tenant_id', $this->currentTenantId())->where('role', 'owner')->count();
            if ($ownerCount <= 1) {
                return response()->json([
                    'message' => 'É necessário manter ao menos um owner na clínica.',
                ], 422);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'Funcionário removido com sucesso.',
        ]);
    }

    /**
     * Ensure the current user can manage employees.
     */
    private function authorizeManagement(): void
    {
        if (! $this->isOwner()) {
            abort(403, 'Apenas o owner pode gerenciar funcionários.');
        }
    }

    /**
     * Ensure the target user belongs to the current tenant.
     */
    private function ensureSameTenant(User $user): void
    {
        if ($user->tenant_id !== $this->currentTenantId()) {
            abort(404);
        }
    }
}
