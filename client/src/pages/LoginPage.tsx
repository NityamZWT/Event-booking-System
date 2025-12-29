import { Link, Navigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAppSelector } from '@/store/hooks';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserRole } from '@/types';

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
  role: Yup.string().oneOf(Object.values(UserRole)).required('Role is required'),
});

export const LoginPage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { login, isLoginLoading } = useAuth();

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
          <Formik
            initialValues={{ email: '', password: '', role: UserRole.CUSTOMER }}
            validationSchema={loginSchema}
            onSubmit={(values) => login(values)}
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Field name="email" type="email" as={Input} />
                  {errors.email && touched.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Field name="password" type="password" as={Input} />
                  {errors.password && touched.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Field name="role" as={Select}>
                    <option value={UserRole.CUSTOMER}>Customer</option>
                    <option value={UserRole.EVENT_MANAGER}>Event Manager</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </Field>
                  {errors.role && touched.role && (
                    <p className="text-sm text-destructive mt-1">{errors.role}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoginLoading}>
                  {isLoginLoading ? 'Logging in...' : 'Login'}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary hover:underline">
                    Register
                  </Link>
                </p>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};