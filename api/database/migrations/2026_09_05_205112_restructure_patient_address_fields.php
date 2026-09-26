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
        Schema::table('patients', function (Blueprint $table) {
            // Remove campos clínicos (serão tratados nos modelos de form depois)
            $table->dropColumn(['referring_doctor', 'notes']);

            // Remove o campo address antigo e cria os campos de endereço completo
            $table->dropColumn('address');

            $table->string('street')->nullable();       // Rua/logradouro
            $table->string('number')->nullable();       // Número
            $table->string('neighborhood')->nullable(); // Bairro
            $table->string('complement')->nullable();   // Complemento
            $table->string('zip_code', 9)->nullable();  // CEP
            $table->string('city')->nullable();         // Cidade
            $table->string('state', 2)->nullable();     // UF (estado)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('referring_doctor')->nullable();
            $table->text('notes')->nullable();
            $table->string('address')->nullable();

            $table->dropColumn([
                'street', 'number', 'neighborhood', 'complement',
                'zip_code', 'city', 'state',
            ]);
        });
    }
};
