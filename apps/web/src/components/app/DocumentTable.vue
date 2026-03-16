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
  <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
    <CardHeader>
      <div class="flex items-center justify-between gap-4">
        <div>
          <CardTitle class="text-[#133e87]">Recently generated documents</CardTitle>
          <CardDescription class="text-[#608bc1]">Your latest output appears here for quick review and filtering.</CardDescription>
        </div>
        <Badge variant="outline" class="border-[#133e87] text-[#133e87]">{{ filteredDocuments.length }} shown</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div class="overflow-hidden rounded-[24px] border border-white/50 bg-white/70">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="bg-[#133e87]/5 text-[#133e87]/70">
            <tr>
              <th class="px-5 py-4 font-semibold">Document</th>
              <th class="px-5 py-4 font-semibold">Created</th>
              <th class="px-5 py-4 font-semibold">Preview</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="document in filteredDocuments" :key="`${document.kind}-${document.createdAt}`" class="border-t border-white/40 hover:bg-white/40 transition-colors">
              <td class="px-5 py-4">
                <Badge variant="secondary" class="bg-[#cbdceb] text-[#133e87] hover:bg-[#cbdceb]/80">{{ document.kind }}</Badge>
              </td>
              <td class="px-5 py-4 text-[#608bc1]">{{ new Date(document.createdAt).toLocaleString() }}</td>
              <td class="px-5 py-4 text-muted-foreground">
                {{ document.content.slice(0, 120) }}{{ document.content.length > 120 ? "..." : "" }}
              </td>
            </tr>
            <tr v-if="filteredDocuments.length === 0">
              <td colspan="3" class="px-5 py-8 text-center text-muted-foreground">No generated documents match your current filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>
