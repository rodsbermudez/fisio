<?php

namespace Illuminate\Database\Migrations;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treatment_cycles', function (Blueprint $table) {
            $table->foreignId('patient_plan_id')->nullable()->after('patient_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('treatment_cycles', function (Blueprint $table) {
            $table->dropForeign(['patient_plan_id']);
            $table->dropColumn('patient_plan_id');
        });
    }
};
