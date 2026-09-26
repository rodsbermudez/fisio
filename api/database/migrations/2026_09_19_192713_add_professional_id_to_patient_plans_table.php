<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('patient_plans', function (Blueprint $table) {
            $table->foreignId('professional_id')->nullable()->after('room_id')->constrained('users')->nullOnDelete();
        });

        // Preenche planos existentes com o profissional dos atendimentos vinculados
        \DB::table('patient_plans')->get()->each(function ($plan) {
            $professionalId = \DB::table('appointments')
                ->where('patient_plan_id', $plan->id)
                ->whereNotNull('professional_id')
                ->value('professional_id');

            if ($professionalId) {
                \DB::table('patient_plans')
                    ->where('id', $plan->id)
                    ->update(['professional_id' => $professionalId]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_plans', function (Blueprint $table) {
            $table->dropForeign(['professional_id']);
            $table->dropColumn('professional_id');
        });
    }
};
