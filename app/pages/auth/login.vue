<script lang="ts" setup>
  import type { FormSubmitEvent } from "@nuxt/ui";
  import z from "zod";

  const { login } = useAuth();

  const schema = z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required"),
  });

  type Schema = z.infer<typeof schema>;

  const fields = ref<Schema>({
    email: "",
    password: "",
  });

  function onSubmit(event: FormSubmitEvent<Schema>) {
    login({
      email: event.data.email,
      password: event.data.password,
    })
      .then(() => {
        console.log("logged in");
      })
      .catch(error => {
        console.error("failed to login", error);
        useToast().add({
          title: "Login failed",
          description: "Please check your credentials.",
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
            <span>Sign in</span>
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Enter your credentials to continue</p>
        </div>
      </template>

      <UForm :schema="schema" :state="fields" @submit="onSubmit">
        <div class="space-y-4">
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
        </div>
        <div class="pt-6">
          <UButton
            type="submit"
            size="lg"
            block
            icon="i-heroicons-arrow-right-20-solid"
            label="Sign in"
            class="w-full"
          />
        </div>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Need an account?
          <NuxtLink to="/auth/register" class="text-primary hover:underline">Sign up</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
