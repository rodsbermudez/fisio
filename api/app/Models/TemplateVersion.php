<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateVersion extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'template_id',
        'tenant_id',
        'version_number',
        'snapshot',
        'has_evaluations',
    ];

    protected $casts = [
        'snapshot' => 'array',
        'has_evaluations' => 'boolean',
        'version_number' => 'integer',
    ];

    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }
}
