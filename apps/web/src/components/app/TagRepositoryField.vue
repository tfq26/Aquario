<script setup lang="ts">
import { computed, ref } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const props = defineProps<{
  modelValue: string[];
  options: readonly string[];
  placeholder?: string;
  addLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const customValue = ref("");

const selectedSet = computed(() => new Set(props.modelValue));

function toggleValue(value: string) {
  const next = selectedSet.value.has(value)
    ? props.modelValue.filter((item) => item !== value)
    : [...props.modelValue, value];

  emit("update:modelValue", next);
}

function addCustomValue() {
  const value = customValue.value.trim();

  if (!value) {
    return;
  }

  if (!selectedSet.value.has(value)) {
    emit("update:modelValue", [...props.modelValue, value]);
  }

  customValue.value = "";
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option"
        type="button"
        class="rounded-full border px-3 py-1.5 text-sm transition-colors"
        :class="
          selectedSet.has(option)
            ? 'border-[#133e87] bg-[#133e87] text-white'
            : 'border-white/50 bg-white/80 text-[#133e87] hover:bg-white'
        "
        @click="toggleValue(option)"
      >
        {{ option }}
      </button>
    </div>

    <div class="flex gap-3">
      <Input
        v-model="customValue"
        :placeholder="placeholder ?? 'Add your own'"
        class="bg-white/90"
        @keyup.enter="addCustomValue"
      />
      <Button variant="outline" class="border-[#133e87] text-[#133e87] hover:bg-[#133e87]/10" @click="addCustomValue">
        {{ addLabel ?? 'Add' }}
      </Button>
    </div>

    <div v-if="modelValue.length" class="flex flex-wrap gap-2">
      <Badge
        v-for="value in modelValue"
        :key="value"
        variant="secondary"
        class="bg-[#133e87]/10 text-[#133e87] border-white/40"
      >
        {{ value }}
      </Badge>
    </div>
  </div>
</template>
