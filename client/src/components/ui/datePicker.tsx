import { Popover } from "@radix-ui/react-popover";
import { ChevronDownIcon } from "lucide-react";
import React from "react";
import { PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar } from "./calendar";

export function DatePicker({
  value,
  onChange,
  placeHolder,
}: {
  value?: Date;
  onChange: (date?: Date) => void;
  placeHolder: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-48 justify-between font-normal">
          {date ? date.toLocaleDateString() : placeHolder}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            setDate(selectedDate);
            setOpen(false);
            onChange(selectedDate);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
