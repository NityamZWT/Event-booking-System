import axios from "@/lib/axios";
import { ApiResponse, PaginatedResponse, User, UserRole } from "@/types";

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

  updateUserRole: async (userId: number, role: UserRole) => {
    const response = await axios.patch(`/users/${userId}/role`, { role });
    return response.data;
  },

   getUserById: async (userId: number) => {
     const response = await axios.get(`/users/${userId}`);
     console.log(response.data);
     
     return response.data;
   } 
};
