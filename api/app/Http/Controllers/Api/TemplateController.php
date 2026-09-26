<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTemplateRequest;
use App\Http\Requests\UpdateTemplateRequest;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        $templates = $this->scopeToTenant(Template::with(['fields' => function ($query) {
                $query->orderBy('sort_order');
            }]))
            ->withCount('versions')
            ->when($request->search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->has('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->latest()
            ->paginate(20);

        return response()->json($templates);
    }

    public function store(StoreTemplateRequest $request)
    {
        $data = $request->validated();

        $template = DB::transaction(function () use ($data) {
            $template = Template::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'current_version' => 1,
                'is_active' => $data['is_active'] ?? true,
                'tenant_id' => $this->currentTenantId(),
                'created_by' => auth()->id(),
            ]);

            $this->syncFields($template, $data['fields'] ?? []);
            $this->createVersionSnapshot($template);

            return $template;
        });

        return response()->json([
            'message' => 'Modelo criado com sucesso.',
            'template' => $template->load('fields'),
        ], 201);
    }

    public function show(Template $template)
    {
        $this->authorizeTenant($template);

        return response()->json([
            'template' => $template->load(['fields', 'versions' => function ($query) {
                $query->latest('version_number');
            }]),
        ]);
    }

    public function update(UpdateTemplateRequest $request, Template $template)
    {
        $this->authorizeTenant($template);

        $data = $request->validated();

        $template = DB::transaction(function () use ($template, $data) {
            $currentVersion = $template->versions()
                ->where('version_number', $template->current_version)
                ->first();

            // Se a versão atual já foi usada em avaliações, cria uma nova versão.
            if ($currentVersion && $currentVersion->has_evaluations) {
                $template->increment('current_version');
            }

            $template->update([
                'title' => $data['title'] ?? $template->title,
                'description' => $data['description'] ?? $template->description,
                'is_active' => $data['is_active'] ?? $template->is_active,
            ]);

            if (isset($data['fields'])) {
                $this->syncFields($template, $data['fields']);
            }

            $this->createVersionSnapshot($template);

            return $template;
        });

        return response()->json([
            'message' => 'Modelo atualizado com sucesso.',
            'template' => $template->load('fields'),
        ]);
    }

    public function destroy(Template $template)
    {
        $this->authorizeTenant($template);

        $template->delete();

        return response()->json([
            'message' => 'Modelo excluído com sucesso.',
        ]);
    }

    private function syncFields(Template $template, array $fields)
    {
        $template->fields()->delete();

        foreach ($fields as $index => $field) {
            $template->fields()->create([
                'label' => $field['label'],
                'type' => $field['type'],
                'options' => $field['options'] ?? null,
                'sort_order' => $index,
                'required' => $field['required'] ?? false,
                'helper_text' => $field['helper_text'] ?? null,
                'tenant_id' => $template->tenant_id,
            ]);
        }
    }

    private function createVersionSnapshot(Template $template)
    {
        $snapshot = [
            'title' => $template->title,
            'description' => $template->description,
            'fields' => $template->fields()->get()->map(function ($field) {
                return [
                    'label' => $field->label,
                    'type' => $field->type,
                    'options' => $field->options,
                    'sort_order' => $field->sort_order,
                    'required' => $field->required,
                    'helper_text' => $field->helper_text,
                ];
            })->toArray(),
        ];

        $template->versions()->updateOrCreate(
            ['version_number' => $template->current_version],
            [
                'snapshot' => $snapshot,
                'tenant_id' => $template->tenant_id,
            ]
        );
    }
}
