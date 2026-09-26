<?php

namespace Illuminate\Database\Migrations;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->boolean('has_evaluation')->default(false)->after('price');
            $table->decimal('evaluation_price', 10, 2)->nullable()->after('has_evaluation');
            $table->unsignedInteger('evaluation_duration_minutes')->nullable()->after('evaluation_price');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['has_evaluation', 'evaluation_price', 'evaluation_duration_minutes']);
        });
    }
};
