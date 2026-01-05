import { type ClassValue, clsx } from "clsx";
import { FormikHelpers } from "formik";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export const formatLocalDate = (date: Date) => {
//   return date.toLocaleDateString("en-IN", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// };

// export function formatDateTime(date: string | Date) {
//   return new Date(date).toLocaleString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

// export function convertLocalToUTCDateString(localDate: Date): string {
//   if (!localDate) return "";

//   // Get UTC date parts (important: use getUTC methods)
//   const year = localDate.getUTCFullYear();
//   const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
//   const day = String(localDate.getUTCDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

// export function convertUTCToLocalDate(utcDateString: string): Date | undefined {
//   if (!utcDateString) return undefined;

//   // Parse UTC date
//   const date = new Date(utcDateString);

//   // Create a new date adjusted to local timezone
//   const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

//   return localDate;
// }

// export function localDateToAPIFormat(date: Date): string {
//   // Get ISO string and extract just the date part
//   const isoString = date.toISOString();
//   return isoString.split("T")[0]; // Returns YYYY-MM-DD
// }

export const handleQuantityOnchange =
  (setFieldValue: FormikHelpers<any>["setFieldValue"], fieldName: string) =>
  (e: any) => {
    const value = e.target.value;
    if (value.includes(".")) {
      setFieldValue(fieldName, Math.floor(parseFloat(value)));
      return;
    }
    setFieldValue(fieldName, value == 0 ? "" : value);
  };

export const formatDate = (dateString: string | Date) => {
  if (!dateString) return "";

  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

// export const formatDateShort = (dateString: string | Date) => {
//   if (!dateString) return "";

//   const date =
//     typeof dateString === "string" ? new Date(dateString) : dateString;

//   return date.toLocaleDateString("en-IN", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//     timeZone: "Asia/Kolkata",
//   });
// };

export const isPastEvent = (eventDate: string | Date) => {
  if (!eventDate) return false;

  const date = typeof eventDate === "string" ? new Date(eventDate) : eventDate;
  const today = new Date();

  // Compare only dates (no time)
  const eventDateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return eventDateOnly < todayOnly;
};

// export const isToday = (dateString: string | Date) => {
//   if (!dateString) return false;

//   const date =
//     typeof dateString === "string" ? new Date(dateString) : dateString;
//   const today = new Date();

//   return (
//     date.getDate() === today.getDate() &&
//     date.getMonth() === today.getMonth() &&
//     date.getFullYear() === today.getFullYear()
//   );
// };
