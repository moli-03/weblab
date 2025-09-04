<script lang="ts" setup>
  import type { FormSubmitEvent } from "@nuxt/ui";
  import z from "zod";

  definePageMeta({
    requiresAuth: false,
  });

  const { register } = useAuth();

  const schema = z
    .object({
      email: z.email(),
      name: z.string().min(2, "Name must be at least 2 characters long."),
      password: z.string().min(8, "Password must be at least 8 characters long."),
      confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
    })
    .refine(data => data.password === data.confirmPassword, {
      error: "Passwords do not match",
      path: ["confirmPassword"],
    });

  type Schema = z.infer<typeof schema>;

  const fields = ref<Schema>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function onSubmit(event: FormSubmitEvent<Schema>) {
    register({
      email: event.data.email,
      password: event.data.password,
      name: event.data.name,
    })
      .then(() => {
        useToast().add({
          title: "Account created",
          description: "You can now sign in with your new account.",
          color: "success",
          icon: "i-heroicons-check-circle-solid",
        });
        navigateTo("/auth/login");
      })
      .catch(error => {
        console.error("failed to register", error);
        useToast().add({
          title: "Couldn't create account",
          description: "Please review the form, fix any errors, and try again.",
          color: "error",
          icon: "i-heroicons-exclamation-triangle-solid",
        });
      });
  }
</script>

<template>
  <div class="w-full py-20 px-4">
    <UCard variant="subtle" class="shadow-sm max-w-md mx-auto w-full">
      <template #header>
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold flex items-center gap-2">
            <UIcon name="i-heroicons-lock-closed" class="w-6 h-6 text-primary" />
            <span>Create account</span>
          </h1>
          <p class="text-sm text-gray-400">Join us by creating your account</p>
        </div>
      </template>

      <UForm :schema="schema" :state="fields" @submit="onSubmit">
        <div class="space-y-4">
          <UFormField label="Full name" name="name">
            <UInput v-model="fields.name" icon="i-heroicons-user" size="lg" class="w-full" placeholder="Jane Doe" />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput
              v-model="fields.email"
              icon="i-heroicons-envelope"
              size="lg"
              class="w-full"
              placeholder="you@example.com"
            />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput
              v-model="fields.password"
              type="password"
              icon="i-heroicons-lock-closed"
              size="lg"
              class="w-full"
              placeholder="••••••••"
            />
          </UFormField>

          <UFormField label="Confirm Password" name="confirmPassword">
            <UInput
              v-model="fields.confirmPassword"
              type="password"
              icon="i-heroicons-lock-closed"
              size="lg"
              class="w-full"
              placeholder="••••••••"
            />
          </UFormField>
        </div>
        <div class="pt-6">
          <UButton type="submit" size="lg" block icon="i-heroicons-plus" label="Create account" class="w-full" />
        </div>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-400">
          Already have an account?
          <NuxtLink to="/auth/login" class="text-primary hover:underline">Sign in</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
