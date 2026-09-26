<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * List users of a specific tenant.
     */
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $query = User::where('tenant_id', $tenant->id)
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
     * Generate an impersonation token for the tenant owner.
     */
    public function impersonate(Request $request, Tenant $tenant): JsonResponse
    {
        if (! $tenant->is_active) {
            throw ValidationException::withMessages([
                'tenant' => ['Não é possível acessar uma clínica suspensa.'],
            ]);
        }

        $owner = User::where('tenant_id', $tenant->id)
            ->where('role', 'owner')
            ->where('is_active', true)
            ->first();

        if (! $owner) {
            throw ValidationException::withMessages([
                'tenant' => ['Clínica não possui um owner ativo para acesso.'],
            ]);
        }

        $token = $owner->createToken('impersonation')->plainTextToken;

        return response()->json([
            'message' => 'Acesso concedido à clínica.',
            'token' => $token,
            'user' => $owner->load('tenant'),
            'tenant' => $tenant,
        ]);
    }
}
