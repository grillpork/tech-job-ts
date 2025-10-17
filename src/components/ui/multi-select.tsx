// src/components/ui/multi-select.tsx
"use client";

import * as React from "react";
import { X, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

// ติดตั้ง: npm install cmdk
// ถ้าใช้ shadcn/ui: npx shadcn-ui@latest add command

type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[]; // array of values
  onSelectedChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, selected, onSelectedChange, placeholder = "Select options..." }: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = React.useCallback((value: string) => {
    setInputValue("");
    const newSelected = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onSelectedChange(newSelected);
  }, [selected, onSelectedChange]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backslash") {
        if (input.value === "" && selected.length > 0) {
          onSelectedChange(selected.slice(0, selected.length - 1));
        }
      }
      // This is not a default behaviour of the Popover component.
      // We can use custom keydown actions for controlling popover state
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
  }, [onSelectedChange, selected]);

  const selectedOptions = options.filter(option => selected.includes(option.value));
  const availableOptions = options.filter(option => !selected.includes(option.value));

  return (
    <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => {
            return (
              <Badge key={option.value} variant="secondary">
                {option.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleSelect(option.value)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          {/* Allow input as a search box */}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : ""}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && availableOptions.length > 0 ? (
          <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto">
              {availableOptions
                .filter(option => option.label.toLowerCase().includes(inputValue.toLowerCase()))
                .map((option) => {
                  return (
                    <CommandItem
                      key={option.value}
                      onMouseDown={(e : any) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => handleSelect(option.value)}
                      className={"cursor-pointer"}
                    >
                      {option.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </div>
        ) : null}
      </div>
    </Command>
  );
}