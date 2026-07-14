<script setup lang="ts">
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Mail, Lock } from "lucide-vue-next";
import AuroraBackground from "@/components/ui/aurora-background/AuroraBackground.vue";
import { useApp } from "@/composables/useApp";

const { auth, ui, login, beginOAuth } = useApp();
</script>

<template>
  <div class="flex min-h-[100vh] w-full items-center justify-center p-4 py-12 md:p-8">
    <!-- Main Window Container -->
    <section class="relative w-full max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-slate-100/10 shadow-[0_40px_110px_-20px_rgba(0,0,0,0.3)] backdrop-blur-3xl dark:border-white/5 dark:bg-black/20">

      <!-- Aurora Background Wrapping the Content -->
      <AuroraBackground class="w-full py-16">
        <div class="relative z-10 w-full px-6 transition-all duration-700 sm:px-12 lg:px-20">
          <div class="grid items-center gap-16 lg:grid-cols-[1fr_480px] lg:gap-24">
            
            <!-- Welcome Column -->
            <div class="reveal-up space-y-6 text-center lg:text-left">
              <h1 class="text-6xl font-bold tracking-[-0.06em] text-foreground sm:text-7xl lg:text-8xl">
                Aquario
              </h1>
              
              <h2 class="mx-auto max-w-md text-2xl font-medium tracking-[-0.03em] text-foreground/80 sm:text-3xl lg:mx-0">
                Sign in to your professional<br class="hidden lg:block" /> resume workspace
              </h2>
            </div>

            <!-- Auth Column (Login Window UI) -->
            <div class="relative">
              <!-- Glow behind the card -->
              <div class="absolute -inset-4 rounded-[2rem] bg-indigo-500/15 blur-3xl"></div>
              
              <Card class="relative border-white/20 bg-white/80 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:shadow-indigo-500/20 dark:border-white/5 dark:bg-black/60 min-h-[520px]">
                <CardHeader class="pt-10">
                  <CardTitle class="text-3xl font-bold tracking-tight">Sign in</CardTitle>
                  <CardDescription>Select your preferred authentication method.</CardDescription>
                </CardHeader>
                
                <CardContent class="space-y-6">
                  <template v-if="auth.loading || ui.bootstrapping">
                    <div class="space-y-4">
                      <Skeleton class="h-14 w-full rounded-xl" />
                      <Skeleton class="h-14 w-full rounded-xl" />
                      <div class="flex items-center gap-3 py-2">
                        <Skeleton class="h-px flex-1" />
                        <Skeleton class="h-4 w-8" />
                        <Skeleton class="h-px flex-1" />
                      </div>
                      <Skeleton class="h-24 w-full rounded-xl" />
                    </div>
                  </template>
                  
                  <template v-else>
                    <!-- OAuth Providers -->
                    <div v-if="auth.providers.google || auth.providers.github" class="grid gap-4">
                      <Button 
                        v-if="auth.providers.google" 
                        variant="outline" 
                        class="group relative h-14 overflow-hidden rounded-xl border-white/40 bg-white/80 px-6 font-semibold transition-all hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-zinc-900/50 dark:hover:bg-zinc-900" 
                        @click="beginOAuth('google')"
                      >
                        <div class="absolute inset-0 translate-y-full bg-gradient-to-t from-indigo-500/5 to-transparent transition-transform duration-500 group-hover:translate-y-0"></div>
                        <img src="https://www.google.com/favicon.ico" alt="" class="mr-3 size-5" />
                        Continue with Google
                      </Button>
                      
                      <Button 
                        v-if="auth.providers.github" 
                        variant="outline" 
                        class="group relative h-14 overflow-hidden rounded-xl border-white/40 bg-white/80 px-6 font-semibold transition-all hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-zinc-900/50 dark:hover:bg-zinc-900" 
                        @click="beginOAuth('github')"
                      >
                        <div class="absolute inset-0 translate-y-full bg-gradient-to-t from-zinc-500/5 to-transparent transition-transform duration-500 group-hover:translate-y-0"></div>
                        <img src="https://github.com/favicon.ico" alt="" class="mr-3 size-5 invert dark:invert-0" />
                        Continue with GitHub
                      </Button>
                    </div>

                    <!-- Divider -->
                    <div v-if="auth.providers.password && (auth.providers.google || auth.providers.github)" class="flex items-center gap-4 py-2">
                      <div class="h-px flex-1 bg-border/40"></div>
                      <span class="text-[10px] font-black text-muted-foreground/60">Or</span>
                      <div class="h-px flex-1 bg-border/40"></div>
                    </div>

                    <!-- Password Inputs -->
                    <div v-if="auth.providers.password" class="space-y-4">
                      <Input 
                        v-model="auth.email" 
                        type="email" 
                        :icon="Mail"
                        placeholder="name@example.com" 
                        @keyup.enter="login" 
                        class="h-14 rounded-xl border-white/30 bg-white/40 shadow-sm backdrop-blur-md transition-all duration-300 focus:bg-white/80 dark:bg-black/20 dark:border-white/10 dark:focus:bg-black/40" 
                      />
                      
                      <Input 
                        v-model="auth.password" 
                        type="password" 
                        :icon="Lock"
                        placeholder="••••••••" 
                        @keyup.enter="login" 
                        class="h-14 rounded-xl border-white/30 bg-white/40 shadow-sm backdrop-blur-md transition-all duration-300 focus:bg-white/80 dark:bg-black/20 dark:border-white/10 dark:focus:bg-black/40" 
                      />
                      
                      <div class="flex items-center gap-3 py-1">
                        <Checkbox v-model:checked="auth.remember" id="remember-me" class="rounded-md border-white/40" />
                        <Label for="remember-me" class="text-sm font-medium text-muted-foreground/80 cursor-pointer select-none hover:text-foreground transition-colors">Remember this device</Label>
                      </div>
                    </div>

                    <!-- Errors -->
                    <div v-if="auth.error || ui.error" class="rounded-xl bg-red-500/10 p-4 border border-red-500/20">
                      <p class="text-sm font-medium text-red-500">{{ auth.error || ui.error }}</p>
                    </div>

                    <p v-if="!auth.configured" class="text-center text-sm font-medium text-amber-500">
                      System administrator: Configure auth secrets.
                    </p>
                  </template>
                </CardContent>

                <CardFooter class="pb-10 pt-2">
                  <Button 
                    v-if="auth.providers.password" 
                    :disabled="auth.submitting || !auth.email || !auth.password" 
                    @click="login"
                    class="h-14 w-full rounded-xl bg-indigo-600 font-bold text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Spinner v-if="auth.submitting" class="mr-3" />
                    Sign in to Workspace
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
          </div>
        </div>
      </AuroraBackground>
    </section>
  </div>
</template>
