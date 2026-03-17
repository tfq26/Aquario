<script setup lang="ts">
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useApp } from "@/composables/useApp";

const { auth, ui, login, beginOAuth } = useApp();
</script>

<template>
  <section
    class="hero-panel relative w-full overflow-hidden rounded-[36px] border border-white/60 px-6 py-10 shadow-[0_24px_80px_rgba(19,62,135,0.12)] sm:px-8 lg:py-16"
  >
    <div class="ambient-grid" />
    <div class="ambient-orb ambient-orb-a" />
    <div class="ambient-orb ambient-orb-b" />
    <div class="relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_460px]">
      <div class="space-y-5 reveal-up text-center my-auto">
        <h1 class="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Aquario</h1>
        <h2 class="text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
          Sign in to your resume workspace
        </h2>
      </div>

      <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use any provider configured for this environment.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <template v-if="auth.loading || ui.bootstrapping">
            <Skeleton class="h-12 w-full" />
            <Skeleton class="h-12 w-full" />
            <Skeleton class="h-20 w-full rounded-[24px]" />
          </template>
          <template v-else>
            <div v-if="auth.providers.google || auth.providers.github" class="grid gap-3">
              <Button v-if="auth.providers.google" variant="outline" class="h-12 rounded-2xl bg-white/85" icon="icon-google" @click="beginOAuth('google')">
                Continue with Google
              </Button>
              <Button v-if="auth.providers.github" variant="outline" class="h-12 rounded-2xl bg-white/85" icon="icon-github" @click="beginOAuth('github')">
                Continue with GitHub
              </Button>
            </div>
            <div v-if="auth.providers.password && (auth.providers.google || auth.providers.github)" class="flex items-center gap-3 py-1">
              <div class="h-px flex-1 bg-border/80" />
              <span class="text-xs uppercase tracking-[0.22em] text-muted-foreground">or</span>
              <div class="h-px flex-1 bg-border/80" />
            </div>
            <div v-if="auth.providers.password" class="field-group">
              <Input v-model="auth.email" type="email" placeholder="Enter your email" @keyup.enter="login" /> 
              <Input v-model="auth.password" type="password" placeholder="Enter your password" @keyup.enter="login" />
            </div>
            <div v-if="auth.providers.password" class="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/70 px-4 py-3">
              <Checkbox v-model:checked="auth.remember" />
              <Label class="text-sm text-muted-foreground cursor-pointer">Keep me signed in</Label>
            </div>
            <p v-if="auth.error" class="text-sm text-primary">{{ auth.error }}</p>
            <p v-if="ui.error" class="text-sm text-primary">{{ ui.error }}</p>
            <p v-if="!auth.configured" class="text-sm text-primary">
              Configure auth secrets before using the app.
            </p>
          </template>
        </CardContent>
        <CardFooter class="justify-center">
          <Button v-if="auth.providers.password" :disabled="auth.submitting || !auth.email || !auth.password" @click="login">
            <Spinner v-if="auth.submitting" class="mr-2" />
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  </section>
</template>
