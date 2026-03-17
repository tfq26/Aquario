<script setup lang="ts">
import { onMounted } from "vue";
import { useApp } from "@/composables/useApp";
import AuthPage from "@/views/AuthPage.vue";
import OnboardingWizard from "@/views/OnboardingWizard.vue";
import AppShell from "@/views/AppShell.vue";

const { auth, ui, bootstrap } = useApp();

onMounted(() => {
  void (async () => {
    const url = new URL(window.location.href);
    const authState = url.searchParams.get("auth");
    const authMessage = url.searchParams.get("message");

    if (authState === "error") {
      auth.error = authMessage || "Sign-in could not be completed.";
    } else if (authState === "success") {
      ui.notice = "Signed in successfully.";
    }

    if (authState) {
      url.searchParams.delete("auth");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }

    await bootstrap();

    if (authState === "success" && !auth.authenticated) {
      auth.error = "Google sign-in finished, but the session cookie was not saved. This is usually a browser cookie or origin setup issue.";
      ui.notice = "";
    }
  })();
});
</script>

<template>
  <main class="min-h-screen bg-background text-foreground">
    <div
      class="w-full max-w-none px-4 py-6 sm:px-6 lg:px-8"
      :class="[
        !auth.authenticated ? 'flex min-h-[calc(100vh-3rem)] flex-col justify-center' : ''
      ]"
    >
      <AuthPage v-if="!auth.authenticated" />
      <OnboardingWizard v-else-if="ui.onboardingActive" />
      <AppShell v-else />
    </div>
  </main>
</template>
