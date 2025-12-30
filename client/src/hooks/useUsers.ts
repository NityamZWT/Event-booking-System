import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@/api/users";
import { QUERY_KEYS } from "@/lib/constants";
import { toast } from "react-toastify";

export const useUsers = (
  params: { page?: number; limit?: number; role?: string } = {}
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS, params],
    queryFn: () => usersAPI.getUsers(params),
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
