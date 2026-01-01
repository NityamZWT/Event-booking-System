import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { Pagination, UserRole } from "@/types";

export const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useUsers({ page, limit: 10, role });
  const deleteUser = useDeleteUser();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading users</div>;
  // console.log(role, 'role');

  const users = data?.data?.users || [];
  const pagination: Pagination = data?.data?.pagination || { totalPages: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <div className="flex gap-2 items-center">
        <Select
          value={role}
          onChange={(e) => {
            e.target.value !== ""
              ? setRole(e.target.value)
              : setRole(undefined);
          }}
        >
          <option value="">All</option>
          <option value={UserRole.CUSTOMER}>Customer</option>
          <option value={UserRole.EVENT_MANAGER}>Event Manager</option>
          <option value={UserRole.ADMIN}>Admin</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users found
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((u: any) => (
                <div
                  key={u.id}
                  className="p-3 border rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {u.email} • {u.role}
                    </p>
                  </div>
                  {u.role !== UserRole.ADMIN && (
                    <div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser.mutate(u.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
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
    </div>
  );
};

export default AdminUsersPage;
