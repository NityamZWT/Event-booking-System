import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '@/api/auth';
import { setCredentials, logout as logoutAction } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { LoginCredentials, RegisterData } from '@/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      if (data.data) {
        dispatch(setCredentials(data.data));
        toast.success('Login successful');
        navigate('/events');
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      if (data.data) {
        dispatch(setCredentials(data.data));
        toast.success('Registration successful');
        navigate('/events');
      }
    },
  });

  const logout = () => {
    dispatch(logoutAction());
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return {
    login: (data: LoginCredentials) => loginMutation.mutate(data),
    register: (data: RegisterData) => registerMutation.mutate(data),
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};