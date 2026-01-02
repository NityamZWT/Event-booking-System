import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { Pagination, UserRole } from "@/types";

export const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");
  
  const { data, isLoading, error, refetch } = useUsers({ page, limit: 10, role });
  const deleteUser = useDeleteUser();

  const handleDeleteClick = (userId: number, userName: string) => {
    setDeleteUserId(userId);
    setDeleteUserName(userName);
  };

  const handleConfirmDelete = async () => {
    if (deleteUserId) {
      try {
        await deleteUser.mutateAsync(deleteUserId);
        await refetch(); // Refresh the list after deletion
      } catch (error) {
        // Handle error if needed
      } finally {
        setDeleteUserId(null);
        setDeleteUserName("");
      }
    }
  };

  if (error) return <div>Error loading users</div>;

  const users = data?.data?.users || [];
  const pagination: Pagination = data?.data?.pagination || { totalPages: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      
      {/* Filter Section */}
      <div className="flex gap-2 items-center">
        <Select
          value={role}
          onChange={(e) => {
            const newRole = e.target.value !== "" ? e.target.value : undefined;
            setRole(newRole);
            setPage(1); // Reset to first page when filter changes
          }}
        >
          <option value="">All</option>
          <option value={UserRole.CUSTOMER}>Customer</option>
          <option value={UserRole.EVENT_MANAGER}>Event Manager</option>
          <option value={UserRole.ADMIN}>Admin</option>
        </Select>
      </div>

      {/* Users Card */}
      <Card className="relative">
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        
        <CardContent className="min-h-[400px]">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center space-y-2">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No users found</p>
              {role && (
                <Button
                  variant="outline"
                  onClick={() => setRole(undefined)}
                  className="mt-2"
                >
                  Clear filter
                </Button>
              )}
            </div>
          ) : null}

          {/* Users List */}
          {users.length > 0 && (
            <div className="space-y-3">
              {users.map((u: any) => (
                <div
                  key={u.id}
                  className="p-4 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {u.first_name} {u.last_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {u.email}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === UserRole.ADMIN 
                          ? 'bg-purple-500/10 text-purple-600'
                          : u.role === UserRole.EVENT_MANAGER
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-green-500/10 text-green-600'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  
                  {u.role !== UserRole.ADMIN && (
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(u.id, `${u.first_name} ${u.last_name}`)}
                        disabled={deleteUser.isPending && deleteUserId === u.id}
                        className="min-w-[80px]"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteUserId !== null}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete user "${deleteUserName}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteUser.isPending}
      />
    </div>
  );
};

export default AdminUsersPage;