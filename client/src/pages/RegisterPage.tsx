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

const registerSchema = Yup.object({
  first_name: Yup.string().min(2).max(50).required('First name is required'),
  last_name: Yup.string().min(2).max(50).required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8)
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character'
    )
    .required('Password is required'),
  role: Yup.string().oneOf(Object.values(UserRole)).required('Role is required'),
});

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
          <Formik
            initialValues={{
              first_name: '',
              last_name: '',
              email: '',
              password: '',
              role: UserRole.CUSTOMER,
            }}
            validationSchema={registerSchema}
            onSubmit={(values) => register(values)}
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Field name="first_name" as={Input} />
                  {errors.first_name && touched.first_name && (
                    <p className="text-sm text-destructive mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Field name="last_name" as={Input} />
                  {errors.last_name && touched.last_name && (
                    <p className="text-sm text-destructive mt-1">{errors.last_name}</p>
                  )}
                </div>

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

                <Button type="submit" className="w-full" disabled={isRegisterLoading}>
                  {isRegisterLoading ? 'Registering...' : 'Register'}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Login
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