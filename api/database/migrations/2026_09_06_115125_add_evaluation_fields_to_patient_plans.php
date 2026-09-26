<?php

namespace Illuminate\Database\Migrations;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_plans', function (Blueprint $table) {
            $table->date('start_date')->nullable()->after('status');
            $table->boolean('has_evaluation')->default(false)->after('start_date');
            $table->decimal('evaluation_price', 10, 2)->nullable()->after('has_evaluation');
            $table->unsignedInteger('evaluation_duration_minutes')->nullable()->after('evaluation_price');
            $table->date('evaluation_date')->nullable()->after('evaluation_duration_minutes');
            $table->time('evaluation_time')->nullable()->after('evaluation_date');
            $table->foreignId('evaluation_room_id')->nullable()->after('evaluation_time')->constrained('rooms')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('patient_plans', function (Blueprint $table) {
            $table->dropForeign(['evaluation_room_id']);
            $table->dropColumn([
                'start_date',
                'has_evaluation',
                'evaluation_price',
                'evaluation_duration_minutes',
                'evaluation_date',
                'evaluation_time',
                'evaluation_room_id',
            ]);
        });
    }
};
