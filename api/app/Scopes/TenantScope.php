<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Se houver um tenant_id na sessão/requisição atual, filtra por ele
        $tenantId = $this->getTenantId();

        if ($tenantId) {
            $builder->where($model->getTable() . '.tenant_id', $tenantId);
        }
    }

    /**
     * Recupera o tenant_id do contexto atual.
     * Pode vir do usuário autenticado ou de outro mecanismo de contexto.
     */
    protected function getTenantId(): ?int
    {
        // Se estiver em uma requisição web/API com usuário autenticado
        if (auth()->check() && auth()->user()->tenant_id) {
            return auth()->user()->tenant_id;
        }

        // Se o tenant_id foi definido manualmente no contexto
        if (app()->has('current_tenant_id')) {
            return app('current_tenant_id');
        }

        return null;
    }
}
