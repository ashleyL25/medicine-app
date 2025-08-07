import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
});

type UserProfileForm = z.infer<typeof userProfileSchema>;

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  user?: User;
}

export default function UserProfileModal({ open, onClose, user }: UserProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<UserProfileForm>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [open, user, form]);

  const updateProfile = useMutation({
    mutationFn: async (data: UserProfileForm) => {
      const response = await apiRequest("PATCH", "/api/auth/user", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserProfileForm) => {
    updateProfile.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl notepad-shadow">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-app-blue">
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-app-blue font-medium">First Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="rounded-xl border-gray-200 focus:ring-app-bronze focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-app-blue font-medium">Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="rounded-xl border-gray-200 focus:ring-app-bronze focus:border-transparent"
                      placeholder="Enter your last name (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-app-blue font-medium">Email</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      className="rounded-xl border-gray-200 focus:ring-app-bronze focus:border-transparent"
                      placeholder="Enter your email"
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="pill-button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateProfile.isPending}
                className="pill-button bg-app-bronze hover:bg-app-bronze/90"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}