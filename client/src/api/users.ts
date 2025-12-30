import axios from "@/lib/axios";
import { ApiResponse, PaginatedResponse, User } from "@/types";

interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: string;
}

export const usersAPI = {
  getUsers: async (params: GetUsersParams = {}) => {
    const response = await axios.get<ApiResponse<PaginatedResponse<User>>>(
      `/users`,
      { params }
    );
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await axios.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  },
};
