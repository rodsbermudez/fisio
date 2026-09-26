<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Platform admin user (no tenant)
        User::firstOrCreate(
            ['email' => 'admin@fisioflow.test'],
            [
                'name' => 'Administrador FisioFlow',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // Create a test tenant
        $tenant = Tenant::firstOrCreate(
            ['email' => 'clinica@fisioflow.test'],
            [
                'name' => 'Clínica Fisio Teste',
                'type' => 'individual',
                'document' => '12345678901',
                'phone' => '(11) 99999-9999',
                'is_active' => true,
            ]
        );

        // Create owner user
        User::firstOrCreate(
            ['email' => 'ana@fisioflow.test'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Dra. Ana Silva',
                'password' => Hash::make('password'),
                'role' => 'owner',
                'phone' => '(11) 99999-9999',
                'crm' => 'CREFITO/SP 12345',
                'is_active' => true,
            ]
        );

        // Create therapist user
        User::firstOrCreate(
            ['email' => 'bruno@fisioflow.test'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Dr. Bruno Costa',
                'password' => Hash::make('password'),
                'role' => 'therapist',
                'phone' => '(11) 98888-8888',
                'crm' => 'CREFITO/SP 67890',
                'is_active' => true,
            ]
        );

        // Create test patients
        $patients = [
            [
                'name' => 'Maria Oliveira',
                'cpf' => '52998224725',
                'birth_date' => '1985-03-15',
                'profession' => 'Professora',
                'phone' => '11999991111',
                'email' => 'maria@example.com',
                'street' => 'Rua das Flores',
                'number' => '123',
                'neighborhood' => 'Centro',
                'complement' => 'Apto 45',
                'zip_code' => '01310100',
                'city' => 'São Paulo',
                'state' => 'SP',
                'emergency_contact_name' => 'João Oliveira',
                'emergency_contact_phone' => '11988881111',
            ],
            [
                'name' => 'Joana Souza',
                'cpf' => '11144477735',
                'birth_date' => '1990-07-22',
                'profession' => 'Advogada',
                'phone' => '11977772222',
                'email' => 'joana@example.com',
                'street' => 'Av. Paulista',
                'number' => '500',
                'neighborhood' => 'Bela Vista',
                'zip_code' => '01310100',
                'city' => 'São Paulo',
                'state' => 'SP',
                'emergency_contact_name' => 'Carlos Souza',
                'emergency_contact_phone' => '11976662222',
            ],
            [
                'name' => 'Carla Mendes',
                'cpf' => '93541134780',
                'birth_date' => '1988-11-08',
                'profession' => 'Enfermeira',
                'phone' => '11966663333',
                'email' => 'carla@example.com',
                'street' => 'Rua Augusta',
                'number' => '800',
                'neighborhood' => 'Consolação',
                'zip_code' => '01304001',
                'city' => 'São Paulo',
                'state' => 'SP',
            ],
        ];

        foreach ($patients as $patientData) {
            Patient::firstOrCreate(
                ['cpf' => $patientData['cpf']],
                array_merge(['tenant_id' => $tenant->id, 'is_active' => true], $patientData)
            );
        }
    }
}
