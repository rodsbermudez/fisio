<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $rooms = $this->scopeToTenant(Room::withCount('appointments'))
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->has('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->latest()
            ->paginate(20);

        return response()->json($rooms);
    }

    private function ensureCapacity(array $data): array
    {
        if (! isset($data['capacity']) || is_null($data['capacity'])) {
            $data['capacity'] = 1;
        }

        return $data;
    }

    public function store(StoreRoomRequest $request)
    {
        $data = $this->ensureCapacity($request->validated());
        $data['tenant_id'] = $this->currentTenantId();

        $room = Room::create($data);

        return response()->json([
            'message' => 'Sala criada com sucesso.',
            'room' => $room,
        ], 201);
    }

    public function show(Room $room)
    {
        $this->authorizeTenant($room);

        return response()->json([
            'room' => $room->loadCount('appointments'),
        ]);
    }

    public function update(UpdateRoomRequest $request, Room $room)
    {
        $this->authorizeTenant($room);

        $room->update($this->ensureCapacity($request->validated()));

        return response()->json([
            'message' => 'Sala atualizada com sucesso.',
            'room' => $room,
        ]);
    }

    public function destroy(Room $room)
    {
        $this->authorizeTenant($room);

        $room->delete();

        return response()->json([
            'message' => 'Sala excluída com sucesso.',
        ]);
    }
}
