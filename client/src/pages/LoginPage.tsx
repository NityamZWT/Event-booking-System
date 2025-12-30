import { Link, Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AuthForm from "@/components/auth/AuthForm";
import { UserRole } from "@/types";
import { loginSchema } from "@/validators/AuthValidators";

export const LoginPage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { login, isLoginLoading } = useAuth();
  const location = useLocation();
  const roleFromState = (location.state as { role?: UserRole })?.role;

  if (isAuthenticated) {
    return <Navigate to="/events" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm
            mode="login"
            initialValues={{
              email: "",
              password: "",
              role: roleFromState || UserRole.CUSTOMER,
            }}
            validationSchema={loginSchema}
            onSubmit={(values) => login(values)}
            submitLabel={isLoginLoading ? "Logging in..." : "Login"}
            isLoading={isLoginLoading}
            hideRole={true}
          />
          <p className="text-sm text-center text-muted-foreground mt-3">
            Already have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
