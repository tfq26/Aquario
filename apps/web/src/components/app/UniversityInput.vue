<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Input } from "@/components/ui/input";
import { createAuthorizedHeaders } from "@/lib/auth-client";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? window.location.origin).replace(/\/$/, "");

const props = defineProps<{
  modelValue: string;
  country: string;
  placeholder?: string;
  class?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const suggestions = ref<Array<{ name: string; stateProvince: string; country: string }>>([]);
const loading = ref(false);
const listId = `university-list-${Math.random().toString(36).slice(2, 10)}`;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeController: AbortController | null = null;

const displaySuggestions = computed(() =>
  suggestions.value.map((item) => (item.stateProvince ? `${item.name} (${item.stateProvince})` : item.name))
);

async function loadSuggestions(query: string) {
  if (!props.country.trim()) {
    suggestions.value = [];
    return;
  }

  activeController?.abort();
  activeController = new AbortController();
  loading.value = true;

  try {
    const url = new URL("/api/universities/search", apiBaseUrl);
    url.searchParams.set("country", props.country.trim());

    if (query.trim()) {
      url.searchParams.set("name", query.trim());
    }

    const response = await fetch(url.toString(), {
      headers: createAuthorizedHeaders(),
      credentials: "include",
      signal: activeController.signal
    });

    if (!response.ok) {
      throw new Error("Unable to fetch universities.");
    }

    suggestions.value = (await response.json()) as Array<{ name: string; stateProvince: string; country: string }>;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      suggestions.value = [];
    }
  } finally {
    loading.value = false;
  }
}

function scheduleLookup(value: string) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    void loadSuggestions(value);
  }, 180);
}

watch(
  () => props.country,
  () => {
    suggestions.value = [];
    if (props.country.trim()) {
      scheduleLookup(props.modelValue);
    }
  }
);
</script>

<template>
  <div class="grid gap-2">
    <Input
      :model-value="modelValue"
      :placeholder="placeholder ?? 'Search for a university'"
      :class="props.class"
      :list="listId"
      @focus="scheduleLookup(modelValue)"
      @update:model-value="
        (value) => {
          emit('update:modelValue', value);
          scheduleLookup(value);
        }
      "
    />
    <p v-if="!country" class="text-xs text-muted-foreground">Choose a country first to search schools.</p>
    <p v-else-if="loading" class="text-xs text-muted-foreground">Looking up universities...</p>
    <datalist :id="listId">
      <option v-for="item in displaySuggestions" :key="item" :value="item" />
    </datalist>
  </div>
</template>
