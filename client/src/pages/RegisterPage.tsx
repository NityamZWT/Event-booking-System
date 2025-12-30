import { Link, Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AuthForm from "@/components/auth/AuthForm";
import { RegisterData, UserRole } from "@/types";
import { registerSchema } from "@/validators/AuthValidators";

export const RegisterPage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { register, isRegisterLoading } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/events" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm
            mode="register"
            initialValues={{
              first_name: "",
              last_name: "",
              email: "",
              password: "",
              role: UserRole.CUSTOMER,
            }}
            validationSchema={registerSchema}
            onSubmit={(values) => register(values as RegisterData)}
            submitLabel={isRegisterLoading ? "Registering..." : "Register"}
            isLoading={isRegisterLoading}
            hideRole={true}
          />
          <p className="text-sm text-center text-muted-foreground mt-3">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
