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
        Schema::table('plans', function (Blueprint $table) {
            $table->unsignedInteger('number_of_appointments')->nullable()->change();
        });

        Schema::table('patient_plans', function (Blueprint $table) {
            $table->unsignedInteger('number_of_appointments')->nullable()->change();
            $table->unsignedInteger('remaining_appointments')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->unsignedInteger('number_of_appointments')->nullable(false)->change();
        });

        Schema::table('patient_plans', function (Blueprint $table) {
            $table->unsignedInteger('number_of_appointments')->nullable(false)->change();
            $table->unsignedInteger('remaining_appointments')->nullable(false)->change();
        });
    }
};
