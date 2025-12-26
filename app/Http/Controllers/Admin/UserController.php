<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class UserController extends Controller
{
    /**
     * Display the users management page (Inertia).
     */
    public function index(Request $request): InertiaResponse
    {
        $query = User::query()->with('roles');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role') && $request->role !== 'all') {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Sort
        $sortColumn = $request->query('sort_column', 'created_at');
        $sortDirection = $request->query('sort_direction', 'desc');

        if (in_array($sortColumn, ['id', 'name', 'email', 'created_at'])) {
            $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Paginate
        $perPage = $request->query('per_page', 10);
        $users = $query->paginate($perPage)->withQueryString();

        // Get all roles for filtering
        $roles = Role::select('id', 'name')->get();

        // Get statistics
        $stats = [
            'total' => User::count(),
            'admins' => User::role('Admin')->count(),
            'moderators' => User::role('Moderator')->count(),
            'reviewers' => User::role('Reviewer')->count(),
        ];

        return Inertia::render('admin/users', [
            'users' => $users,
            'roles' => $roles,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'role' => $request->role ?? 'all',
                'sort_column' => $sortColumn,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * API endpoint to get users list (JSON).
     */
    public function apiIndex(Request $request): JsonResponse
    {
        $query = User::query()->with('roles');

        // Search
        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sort
        if ($request->has('sort_column') && $request->has('sort_direction')) {
            $column = $request->query('sort_column');
            $direction = $request->query('sort_direction');

            if (in_array($column, ['id', 'name', 'email', 'created_at'])) {
                $query->orderBy($column, $direction === 'asc' ? 'asc' : 'desc');
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Paginate
        $perPage = $request->query('per_page', 10);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Assign roles
        if (isset($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        $user->load('roles');

        return response()->json($user, 201);
    }

    /**
     * Display the specified user.
     */
    public function show($id): JsonResponse
    {
        $user = User::with('roles')->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
        ]);

        // Update password if provided
        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        // Update roles
        if (isset($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        $user->load('roles');

        return response()->json($user);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy($id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if (auth()->id() === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account',
            ], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Get all roles for the dropdown.
     */
    public function roles(): JsonResponse
    {
        $roles = Role::select('id', 'name')->get();

        return response()->json($roles);
    }
}
