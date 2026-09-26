<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Cpf implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Remove caracteres não numéricos
        $cpf = preg_replace('/\D/', '', (string) $value);

        // Verifica tamanho
        if (strlen($cpf) !== 11) {
            $fail('O CPF deve conter 11 dígitos.');
            return;
        }

        // Verifica se todos os dígitos são iguais (inválido)
        if (preg_match('/(\d)\1{10}/', $cpf)) {
            $fail('CPF inválido.');
            return;
        }

        // Calcula o primeiro dígito verificador
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $sum += (int) $cpf[$i] * (10 - $i);
        }
        $firstDigit = ($sum * 10) % 11;
        $firstDigit = $firstDigit === 10 ? 0 : $firstDigit;

        if ($firstDigit !== (int) $cpf[9]) {
            $fail('CPF inválido.');
            return;
        }

        // Calcula o segundo dígito verificador
        $sum = 0;
        for ($i = 0; $i < 10; $i++) {
            $sum += (int) $cpf[$i] * (11 - $i);
        }
        $secondDigit = ($sum * 10) % 11;
        $secondDigit = $secondDigit === 10 ? 0 : $secondDigit;

        if ($secondDigit !== (int) $cpf[10]) {
            $fail('CPF inválido.');
            return;
        }
    }
}
