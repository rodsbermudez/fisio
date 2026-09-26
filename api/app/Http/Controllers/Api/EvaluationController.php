<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use App\Models\Template;
use App\Models\TreatmentCycle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvaluationController extends Controller
{
    public function index(Request $request)
    {
        $query = Evaluation::with(['patient', 'treatmentCycle', 'templateVersion']);

        if ($request->treatment_cycle_id) {
            $query->where('treatment_cycle_id', $request->treatment_cycle_id);
        }

        if ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'treatment_cycle_id' => 'required|exists:treatment_cycles,id',
            'template_id' => 'required|exists:templates,id',
            'responses' => 'nullable|array',
        ]);

        $cycle = TreatmentCycle::findOrFail($data['treatment_cycle_id']);
        $template = Template::findOrFail($data['template_id']);

        $evaluation = DB::transaction(function () use ($cycle, $template, $data) {
            $version = $template->versions()
                ->where('version_number', $template->current_version)
                ->firstOrFail();

            $version->update(['has_evaluations' => true]);

            return Evaluation::create([
                'patient_id' => $cycle->patient_id,
                'treatment_cycle_id' => $cycle->id,
                'template_version_id' => $version->id,
                'responses' => $data['responses'] ?? [],
            ]);
        });

        return response()->json([
            'message' => 'Avaliação criada com sucesso.',
            'evaluation' => $evaluation->load(['patient', 'treatmentCycle', 'templateVersion.template']),
        ], 201);
    }

    public function show(Evaluation $evaluation)
    {
        return response()->json([
            'evaluation' => $evaluation->load(['patient', 'treatmentCycle', 'templateVersion.template']),
        ]);
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $data = $request->validate([
            'responses' => 'required|array',
        ]);

        $evaluation->update($data);

        return response()->json([
            'message' => 'Avaliação atualizada com sucesso.',
            'evaluation' => $evaluation->load(['patient', 'treatmentCycle', 'templateVersion.template']),
        ]);
    }

    public function finalize(Evaluation $evaluation)
    {
        if ($evaluation->finalized_at) {
            return response()->json([
                'message' => 'Esta avaliação já está finalizada.',
            ], 422);
        }

        $evaluation->update(['finalized_at' => now()]);

        return response()->json([
            'message' => 'Avaliação finalizada com sucesso.',
            'evaluation' => $evaluation,
        ]);
    }

    public function unfinalize(Evaluation $evaluation)
    {
        if (! $evaluation->finalized_at) {
            return response()->json([
                'message' => 'Esta avaliação já está em edição.',
            ], 422);
        }

        $evaluation->update(['finalized_at' => null]);

        return response()->json([
            'message' => 'Avaliação reaberta para edição com sucesso.',
            'evaluation' => $evaluation,
        ]);
    }

    public function destroy(Evaluation $evaluation)
    {
        $evaluation->delete();

        return response()->json([
            'message' => 'Avaliação excluída com sucesso.',
        ]);
    }
}
