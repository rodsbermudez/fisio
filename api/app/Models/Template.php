<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Template extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'title',
        'description',
        'current_version',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'current_version' => 'integer',
    ];

    public function fields()
    {
        return $this->hasMany(TemplateField::class)->orderBy('sort_order');
    }

    public function versions()
    {
        return $this->hasMany(TemplateVersion::class)->orderBy('version_number', 'desc');
    }

    public function currentVersion()
    {
        return $this->hasOne(TemplateVersion::class)
            ->where('version_number', $this->current_version);
    }
}
