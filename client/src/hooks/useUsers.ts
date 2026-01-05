import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@/api/users";
import { QUERY_KEYS } from "@/lib/constants";
import { toast } from "react-toastify";
import { UpdateRoleData } from "@/types";

export const useUsers = (
  params: { page?: number; limit?: number; role?: string } = {}
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS, params],
    queryFn: () => usersAPI.getUsers(params),
  });
};

export const useUser = (userId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS, userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const response = await usersAPI.getUserById(userId);
      return response;
    },
    enabled: !!userId,
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersAPI.deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      toast.success("User deleted");
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateRoleData) => {
      console.log(data, "data");
      
      const response = await usersAPI.updateUserRole(data.userId, data.role);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData([QUERY_KEYS.USERS, variables.userId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              role: variables.role,
            },
          };
        }
        return oldData;
      });
      
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user role");
    },
  });
};
