"use client";

/* eslint-disable react-hooks/set-state-in-effect -- resetting the form when the
   dialog opens is the documented RHF pattern for external-state sync */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { peopleService } from "@/services/people";
import { getErrorMessage } from "@/lib/utils";
import type { Person } from "@/types";

const personSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  user_name: z.string().optional(),
  teams: z.string().optional(),
  email: z.union([z.email("Enter a valid email address."), z.literal("")]),
  department: z.string().optional(),
  designation: z.string().optional(),
  additional_info: z.string().optional(),
});

type PersonValues = z.infer<typeof personSchema>;

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  person?: Person | null;
}

export function PersonFormDialog({ open, onOpenChange, onSaved, person }: PersonFormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(person?.is_active ?? true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      full_name: person?.full_name ?? "",
      user_name: person?.user_name ?? "",
      teams: person?.teams ?? "",
      email: person?.email ?? "",
      department: person?.department ?? "",
      designation: person?.designation ?? "",
      additional_info: person?.additional_info ?? "",
    },
  });

  // Resetting the form when the dialog opens is the documented RHF pattern
  // for syncing external state into a form.
  useEffect(() => {
    if (open) {
      reset({
        full_name: person?.full_name ?? "",
        user_name: person?.user_name ?? "",
        teams: person?.teams ?? "",
        email: person?.email ?? "",
        department: person?.department ?? "",
        designation: person?.designation ?? "",
        additional_info: person?.additional_info ?? "",
      });
      setIsActive(person?.is_active ?? true);
    }
  }, [open, person, reset]);

  const onSubmit = async (values: PersonValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        email: values.email ?? "",
        user_name: values.user_name ?? "",
        teams: values.teams ?? "",
        department: values.department ?? "",
        designation: values.designation ?? "",
        additional_info: values.additional_info ?? "",
        is_active: isActive,
      };
      if (person) {
        await peopleService.update(person.id, payload);
        toast.success("Person updated successfully.");
      } else {
        await peopleService.create(payload);
        toast.success("Person added successfully.");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't save this person. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{person ? "Edit Person" : "Add Person"}</DialogTitle>
          <DialogDescription>
            {person
              ? "Update this person's profile information."
              : "Add someone connected to your organization. Duplicate names are supported — each person gets a unique ID."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="person-full_name">Full Name</Label>
            <Input
              id="person-full_name"
              placeholder="e.g. Ravi Kumar"
              aria-invalid={Boolean(errors.full_name)}
              {...register("full_name")}
            />
            {errors.full_name && <p className="text-xs text-danger">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="person-email">Email (optional)</Label>
            <Input
              id="person-email"
              type="email"
              placeholder="ravi@company.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="person-user_name">User Name (optional)</Label>
              <Input id="person-user_name" placeholder="e.g. ravi.k" {...register("user_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-teams">Teams (optional)</Label>
              <Input id="person-teams" placeholder="e.g. Platform, Design" {...register("teams")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="person-department">Department</Label>
              <Input id="person-department" placeholder="e.g. Development" {...register("department")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-designation">Designation</Label>
              <Input id="person-designation" placeholder="e.g. Senior Developer" {...register("designation")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="person-info">Additional Info (optional)</Label>
            <Textarea
              id="person-info"
              placeholder="Notes used by AI matching, e.g. 'Owns the API platform'"
              className="min-h-[70px]"
              {...register("additional_info")}
            />
          </div>

          {person && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <Label htmlFor="person-active" className="cursor-pointer">
                Active
              </Label>
              <Switch id="person-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />}
              {person ? "Save Changes" : "Add Person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
