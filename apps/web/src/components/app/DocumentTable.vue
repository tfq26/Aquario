<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/composables/useApp";

const { state, controls } = useApp();

const filteredDocuments = computed(() => {
  const search = controls.search.trim().toLowerCase();

  return state.generated.filter((document) => {
    const matchesFilter = controls.filter === "all" || document.kind === controls.filter;
    const matchesSearch =
      !search ||
      document.kind.toLowerCase().includes(search) ||
      document.content.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });
});
</script>

<template>
  <Card class="border-white/10 bg-[#cbdceb]/60 backdrop-blur-md dark:bg-black/40 dark:border-white/5 shadow-sm rounded-md">
    <CardHeader>
      <div class="flex items-center justify-between gap-4">
        <div>
          <CardTitle class="text-[#133e87] dark:text-[#f3f3e0]">Recently generated documents</CardTitle>
          <CardDescription class="text-[#608bc1] dark:text-sky-400/70">Your latest output appears here for quick review and filtering.</CardDescription>
        </div>
        <Badge variant="outline" class="border-[#133e87] dark:border-sky-500/30 text-[#133e87] dark:text-sky-300">{{ filteredDocuments.length }} shown</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div class="overflow-hidden rounded-md border border-white/50 dark:border-white/10 bg-white/70 dark:bg-black/20">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="bg-[#133e87]/5 dark:bg-white/5 text-[#133e87]/70 dark:text-[#f3f3e0]/60">
            <tr>
              <th class="px-5 py-4 font-semibold">Document</th>
              <th class="px-5 py-4 font-semibold">Created</th>
              <th class="px-5 py-4 font-semibold">Preview</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="document in filteredDocuments" :key="`${document.kind}-${document.createdAt}`" class="border-t border-white/40 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
              <td class="px-5 py-4">
                <Badge variant="secondary" class="bg-[#cbdceb] dark:bg-sky-900/40 text-[#133e87] dark:text-sky-200 hover:bg-[#cbdceb]/80 dark:hover:bg-sky-900/60">{{ document.kind }}</Badge>
              </td>
              <td class="px-5 py-4 text-[#608bc1] dark:text-sky-400/80">{{ new Date(document.createdAt).toLocaleString() }}</td>
              <td class="px-5 py-4 text-muted-foreground dark:text-[#f3f3e0]/70">
                {{ document.content.slice(0, 120) }}{{ document.content.length > 120 ? "..." : "" }}
              </td>
            </tr>
            <tr v-if="filteredDocuments.length === 0">
              <td colspan="3" class="px-5 py-8 text-center text-muted-foreground dark:text-muted-foreground/50">No generated documents match your current filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>
