<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateField extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'template_id',
        'tenant_id',
        'label',
        'type',
        'options',
        'sort_order',
        'required',
        'helper_text',
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
