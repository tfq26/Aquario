<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority";
import { computed } from "vue";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-background/80 text-foreground",
        soft: "border-transparent bg-primary/10 text-primary"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

type BadgeVariants = VariantProps<typeof badgeVariants>;

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariants["variant"];
    class?: string;
  }>(),
  {
    variant: "default",
    class: ""
  }
);

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
