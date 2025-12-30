import { Alert, AlertDescription } from '../ui/alert';

export const ErrorMessage = ({ error }: { error: any }) => {
  if (!error) return null;

  const message = error?.response?.data?.message || error.message || 'An error occurred';

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
