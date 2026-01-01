import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { store } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { ErrorType, ApiErrorResponse } from "@/types";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (!error.response) {
      if (error.request) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      return Promise.reject(error);
    }

    const { response } = error;
    const errorData = (response.data as ApiErrorResponse) || {};
    const errorType = errorData?.type || "";
    const errorMessage =
      errorData?.errors && Object.keys(errorData.errors).length > 0
        ? typeof errorData.errors[Object.keys(errorData.errors)[0]] === "string"
          ? errorData.errors[Object.keys(errorData.errors)[0]]
          : errorData?.message || response.statusText || "An error occurred"
        : errorData?.message || response.statusText || "An error occurred";
    const statusCode = response.status;

    switch (statusCode) {
      case 401:
        if (errorType === ErrorType.AUTHENTICATION_ERROR || !errorType) {
          store.dispatch(logout());
          toast.error(
            errorMessage || "Your session has expired. Please login again."
          );
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        }
        break;

      case 403:
        toast.error(
          errorMessage || "You don't have permission to perform this action."
        );
        break;

      case 400:
        if (errorType === ErrorType.VALIDATION_ERROR) {
          const validationMessage =
            errorMessage || "Please check your input and try again.";
          toast.error(validationMessage);
        } else {
          toast.error(
            errorMessage || "Invalid request. Please check your input."
          );
        }
        break;

      case 404:
        if (errorType === ErrorType.NOT_FOUND_ERROR) {
          toast.error(errorMessage || "The requested resource was not found.");
        } else {
          toast.error(errorMessage || "Resource not found.");
        }
        break;

      case 409:
        if (errorType === ErrorType.CONFLICT_ERROR) {
          toast.error(errorMessage || "This resource already exists.");
        } else {
          toast.error(
            errorMessage || "A conflict occurred with the current state."
          );
        }
        break;

      case 500:
        if (errorType === ErrorType.DATABASE_ERROR) {
          toast.error("Database error occurred. Please try again later.");
        } else if (errorType === ErrorType.INTERNAL_SERVER_ERROR) {
          toast.error(
            "An internal server error occurred. Please try again later."
          );
        } else {
          toast.error("Server error. Please try again later.");
        }
        break;

      default:
        if (errorType) {
          switch (errorType) {
            case ErrorType.VALIDATION_ERROR:
              toast.error(
                errorMessage || "Validation failed. Please check your input."
              );
              break;
            case ErrorType.AUTHENTICATION_ERROR:
              store.dispatch(logout());
              toast.error(
                errorMessage || "Authentication failed. Please login again."
              );
              setTimeout(() => {
                window.location.href = "/login";
              }, 1000);
              break;
            case ErrorType.AUTHORIZATION_ERROR:
              toast.error(
                errorMessage ||
                  "You don't have permission to perform this action."
              );
              break;
            case ErrorType.NOT_FOUND_ERROR:
              toast.error(errorMessage || "Resource not found.");
              break;
            case ErrorType.CONFLICT_ERROR:
              toast.error(errorMessage || "A conflict occurred.");
              break;
            case ErrorType.DATABASE_ERROR:
              toast.error("Database error occurred. Please try again later.");
              break;
            case ErrorType.INTERNAL_SERVER_ERROR:
              toast.error(
                "An internal server error occurred. Please try again later."
              );
              break;
            default:
              toast.error(
                errorMessage || "An error occurred. Please try again."
              );
          }
        } else {
          toast.error(
            errorMessage ||
              `An error occurred (${statusCode}). Please try again.`
          );
        }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
