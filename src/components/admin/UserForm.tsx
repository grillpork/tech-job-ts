"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/features/userStore";

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  imageUrl?: string | null;
};

export default function UserForm({ user, onClose }: { user: User; onClose: () => void }) {
  const updateUser = useUserStore((s) => s.updateUser);
  const { register, handleSubmit } = useForm({ defaultValues: user });

  const onSubmit = (values: any) => {
    updateUser(user.id, values);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input className="mt-1" {...register("name")} />
      </div>

      <div>
        <Label>Email</Label>
        <Input type="email" className="mt-1" {...register("email")} />
      </div>

      <div>
        <Label>Role</Label>
        <Input className="mt-1" {...register("role")} />
      </div>

      <div>
        <Label>Image URL</Label>
        <Input className="mt-1" {...register("imageUrl")} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
