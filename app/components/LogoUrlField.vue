<script lang="ts" setup>
  import type { BadgeProps } from "@nuxt/ui";
  import z from "zod";

  interface Props {
    modelValue: string | null | undefined;
    name?: string;
    label?: string;
    disabled?: boolean;
    placeholder?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    name: "logoUrl",
    label: "Logo URL",
    disabled: false,
    placeholder: "https://cdn.example.com/logo.svg",
  });

  const emit = defineEmits<{
    (e: "update:modelValue", value: string | null | undefined): void;
  }>();

  // Status handling
  type LogoStatus = "idle" | "loading" | "ok" | "error";
  const status = ref<LogoStatus>("idle");
  const message = ref("");

  function reset() {
    status.value = "idle";
    message.value = "";
  }

  const urlSchema = z.httpUrl();

  async function isImage(url: string | null): Promise<boolean> {
    if (!url) {
      reset();
      return true; // Allow null/empty values
    }

    if (!urlSchema.safeParse(url).success) {
      status.value = "error";
      message.value = "Invalid URL format";
      return false;
    }

    status.value = "loading";
    message.value = "Checking image...";

    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      const isImageType = contentType?.startsWith("image/") ?? false;
      if (isImageType) {
        status.value = "ok";
        message.value = "Valid image URL";
        return true;
      } else {
        status.value = "error";
        message.value = "URL does not point to a valid image";
        return false;
      }
    } catch (error) {
      console.error("Error validating image URL:", error);
      status.value = "error";
      message.value = "URL does not point to a valid image";
      return false;
    }
  }

  async function update(v: string | null) {
    const isValid = await isImage(v);
    if (isValid) {
      emit("update:modelValue", v);
    }
  }

  const debouncedUpdate = useDebounceFn(update, 800);

  const badgeProps = computed<BadgeProps | null>(() => {
    if (status.value === "ok") {
      return { color: "success", label: "Valid" };
    }
    if (status.value === "loading") {
      return { color: "primary", label: "Checking" };
    }
    if (status.value === "error") {
      return { color: "error", label: "Error" };
    }
    return null;
  });
</script>

<template>
  <div class="flex items-start gap-4">
    <UFormField :name="props.name" :label="props.label" class="flex-1">
      <template #label>
        <div class="flex items-center gap-2">
          <span>{{ props.label }}</span>
          <UBadge v-if="badgeProps" :color="badgeProps.color" size="xs" variant="soft" :label="badgeProps.label" />
        </div>
      </template>
      <div class="flex gap-2">
        <UInput
          class="flex-1"
          :model-value="props.modelValue"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
          @update:model-value="debouncedUpdate"
        />

        <UButton
          v-if="props.modelValue"
          variant="ghost"
          size="xs"
          icon="material-symbols:close"
          aria-label="Clear logo"
          @click="
            reset();
            emit('update:modelValue', null);
          "
        />
      </div>
      <template #help>
        <p class="text-[11px] leading-snug" :class="status === 'error' ? 'text-error' : 'text-zinc-500'">
          {{ message || "Direct link to an image. Left blank = no logo." }}
        </p>
      </template>
    </UFormField>
    <div class="rounded-lg size-14 border border-zinc-700 flex items-center justify-center">
      <img
        v-if="props.modelValue && status === 'ok'"
        :src="props.modelValue"
        alt="Logo preview"
        class="object-contain w-full h-full rounded-lg"
      />
      <UIcon v-else name="material-symbols:image" class="text-xl text-zinc-600" />
    </div>
  </div>
</template>
