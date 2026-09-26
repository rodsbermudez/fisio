<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;

abstract class Controller
{
    /**
     * Get the current authenticated user's tenant id.
     */
    protected function currentTenantId(): ?int
    {
        $user = auth()->user();

        return $user?->tenant_id;
    }

    /**
     * Scope a query to the current user's tenant.
     */
    protected function scopeToTenant(Builder $query, string $column = 'tenant_id'): Builder
    {
        $tenantId = $this->currentTenantId();

        if ($tenantId) {
            $query->where($column, $tenantId);
        }

        return $query;
    }

    /**
     * Check if the authenticated user is a tenant owner.
     */
    protected function isOwner(): bool
    {
        return auth()->user()?->isOwner() ?? false;
    }

    /**
     * Check if the authenticated user is a therapist.
     */
    protected function isTherapist(): bool
    {
        return auth()->user()?->isTherapist() ?? false;
    }

    /**
     * Ensure a model belongs to the current tenant.
     */
    protected function authorizeTenant($model, string $column = 'tenant_id'): void
    {
        $tenantId = $this->currentTenantId();

        if ($tenantId && $model->{$column} !== $tenantId) {
            abort(404);
        }
    }
}
