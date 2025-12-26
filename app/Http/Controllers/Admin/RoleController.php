<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RoleController extends Controller
{
    /**
     * Display the roles management page (Inertia).
     */
    public function index(Request $request): InertiaResponse
    {
        $query = Role::query()->withCount('users');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Sort
        $sortColumn = $request->query('sort_column', 'name');
        $sortDirection = $request->query('sort_direction', 'asc');

        if (in_array($sortColumn, ['id', 'name', 'created_at', 'users_count'])) {
            $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('name', 'asc');
        }

        // Paginate
        $perPage = $request->query('per_page', 10);
        $roles = $query->paginate($perPage)->withQueryString();

        // Load permissions for each role
        $roles->getCollection()->transform(function ($role) {
            $role->permissions = $role->permissions()->pluck('name')->toArray();
            return $role;
        });

        // Get all available permissions
        $allPermissions = Permission::orderBy('name')->get();

        // Get statistics
        $stats = [
            'total' => Role::count(),
            'with_users' => Role::has('users')->count(),
            'permissions' => Permission::count(),
        ];

        return Inertia::render('admin/roles', [
            'roles' => $roles,
            'allPermissions' => $allPermissions,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'sort_column' => $sortColumn,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        // Assign permissions
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $role->load('permissions');

        return response()->json($role, 201);
    }

    /**
     * Display the specified role.
     */
    public function show($id): JsonResponse
    {
        $role = Role::with('permissions')->withCount('users')->findOrFail($id);

        return response()->json($role);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('roles')->ignore($role->id),
            ],
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        if (isset($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        // Update permissions
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $role->load('permissions');

        return response()->json($role);
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy($id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Prevent deleting certain system roles
        if (in_array($role->name, ['Admin', 'Super Admin'])) {
            return response()->json([
                'message' => 'Cannot delete system role: ' . $role->name,
            ], 403);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }

    /**
     * Get all permissions for the dropdown.
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::orderBy('name')->get();

        return response()->json($permissions);
    }
}
