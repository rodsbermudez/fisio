<?php

namespace Illuminate\Database\Migrations;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_plans', function (Blueprint $table) {
            $table->enum('billing_type', ['appointments', 'monthly'])->default('appointments')->after('duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('patient_plans', function (Blueprint $table) {
            $table->dropColumn('billing_type');
        });
    }
};
